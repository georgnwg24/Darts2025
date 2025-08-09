import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Game, GameDocument, Status, TeamData } from "./schemas/game.schema";
import { Model } from "mongoose";
import { CreateGameDto } from "./dtos/create-game.dto";
import { RecordThrowDto } from "./dtos/record-throw.dto";

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameDocument> {
    this.logger.log(`Creating game: ${JSON.stringify(createGameDto)}`);
    try {
      const teamData = createGameDto.teamData.map((team, index) => ({
        teamName: team.teamName,
        playerNames: team.playerNames,
        throwsByRound: index === 0 ? [[]] : [],
        currentPlayerIndex: 0,
      }));

      const game = new this.gameModel({
        currentRound: 1,
        roundLimit: createGameDto.roundLimit,
        scoreLimit: createGameDto.scoreLimit,
        teamData,
        currentTeamIndex: 0,
        status: Status.ACTIVE,
      });
      this.logger.log(`Game created with ID: ${game.id}`);
      return await game.save();
    } catch (error) {
      this.logger.error(`Failed to create game: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<GameDocument> {
    this.logger.debug(`Finding game by ID: ${id}`);
    this.isMongoId(id);
    try {
      const game = await this.gameModel.findById(id).exec();
      if (!game) {
        this.logger.warn(`Game not found: ${id}`);
        throw new NotFoundException(`Game with ID ${id} not found`);
      }
      return game;
    } catch (error) {
      this.logger.error(`Error finding game ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<GameDocument[]> {
    return this.gameModel.find().sort({ createdAt: -1 }).exec();
  }

  async recordThrow(id: string, recordThrowDto: RecordThrowDto): Promise<GameDocument> {
    this.logger.log(`Recording throw for game ${id}: ${JSON.stringify(recordThrowDto)}`);
    try { 
      const game = await this.findById(id);

      if(recordThrowDto.teamName != game.teamData[game.currentTeamIndex].teamName) {
        throw new BadRequestException(`It's not team ${recordThrowDto.teamName}'s turn`);
      }

      if (game.gameWinner) {
        throw new BadRequestException(`Throw can not be recorded. Game ${id} already has a winner: ${game.gameWinner}`)
      }

      const currentTeamData = game.teamData[game.currentTeamIndex];
      const currentRoundThrows = currentTeamData.throwsByRound[currentTeamData.throwsByRound.length -1];

      if (!currentRoundThrows) {
        throw new BadRequestException('No active round for the team');
      }

      if (currentRoundThrows.length === 3) {
        throw new BadRequestException('The team has already thrown 3 times in this round.');
      }

      const newScore = this.getTotalScore(currentTeamData.throwsByRound) + recordThrowDto.score;

      if (game.scoreLimit) {
        if (newScore > game.scoreLimit) { // Overthrow
          this.logger.log(`Overthrow detected for team ${recordThrowDto.teamName}`);
          const currentRoundSum = currentRoundThrows.reduce((sum, score) => sum + score, 0);
          currentRoundThrows.push(-currentRoundSum);
          await this.completeTurn(game, currentTeamData);
          return await game.save();
        } else if (newScore === game.scoreLimit) {
          this.logger.log(`Team ${currentTeamData.teamName} won the game!`);
          currentRoundThrows.push(recordThrowDto.score);
          game.gameWinner = currentTeamData.teamName;
          game.status = Status.COMPLETE;
          return await game.save();
        }
      }

      currentRoundThrows.push(recordThrowDto.score);
      if (currentRoundThrows.length === 3) {
        await this.completeTurn(game, currentTeamData);
      }
      return await game.save();
    } catch (error) {
      this.logger.error(`Error recording throw: ${error.message}`, error.stack);
      throw error;
    } 
  }

  private async completeTurn(game: GameDocument, currentTeamData: TeamData): Promise<void> {
    this.logger.debug(`Completing turn for team ${currentTeamData.teamName} in game ${game.id}`);
    currentTeamData.currentPlayerIndex = (currentTeamData.currentPlayerIndex + 1) % currentTeamData.playerNames.length;
    const nOfTeams = game.teamData.length;
    if (game.currentTeamIndex === nOfTeams -1) { // Last team completed turn - advance round
      this.logger.log(`Advancing to round ${game.currentRound}`);
      game.currentRound++;

      if (game.roundLimit < game.currentRound) {
        await this.setRoundLimitWinner(game);
        return;
      }
    }

    game.currentTeamIndex = (game.currentTeamIndex +1) % nOfTeams;
    game.teamData[game.currentTeamIndex].throwsByRound.push([]); // Add an empty array for the next teams throws
  }

  private async setRoundLimitWinner(game: GameDocument) {
    this.logger.log(`Determining round limit winner for game ${game.id}`);
    let maxScore = -1;
    let winningTeam: string | undefined = undefined;

    for (const teamData of game.teamData) {
      const totalScore = this.getTotalScore(teamData.throwsByRound);
      if (totalScore > maxScore) {
        maxScore = totalScore;
        winningTeam = teamData.teamName;
      } else if (totalScore === maxScore) {
        winningTeam = undefined; // Tie - no winner yet
      }
    }

    if (winningTeam) {
      game.gameWinner = winningTeam;
      this.logger.log(`Round limit winner: ${winningTeam}`);
    } else {
      this.logger.log(`No clear winner - tie detected`);
    }
    game.status = Status.COMPLETE;
    return await game.save();
  }

  async rollBackThrow(id: string): Promise<GameDocument> {
    this.logger.log(`Rolling back last throw for game ${id}`);
    try {
      const game = await this.findById(id);

      game.gameWinner = undefined; // Reset winner
      game.status = Status.ACTIVE;

      let lastThrowTeamIndex = -1;
      let lastRoundIndex = -1;

      // Iterate backwards from the current team index to find the team that made the last throw.
      for (let i = 0; i < game.teamData.length; i++) {
          const teamIndex = (game.currentTeamIndex - i + game.teamData.length) % game.teamData.length;
          const teamData = game.teamData[teamIndex];
          
          if (teamData.throwsByRound.length > 0) {
              const roundThrows = teamData.throwsByRound[teamData.throwsByRound.length - 1];
              if (roundThrows.length > 0) {
                  lastThrowTeamIndex = teamIndex;
                  lastRoundIndex = teamData.throwsByRound.length - 1;
                  break;
              }
          }
      }

      if (lastThrowTeamIndex === -1) {
          throw new BadRequestException('No throws to rollback');
      }

      // Get the last round and pop the last throw
      const lastThrowTeam = game.teamData[lastThrowTeamIndex];
      const lastRound = lastThrowTeam.throwsByRound[lastRoundIndex];
      lastRound.pop();

      // If the last throw was not made by the current team, we need to revert the game state.
      if (lastThrowTeamIndex !== game.currentTeamIndex) {
          // Remove the empty round from the current team
          const currentTeam = game.teamData[game.currentTeamIndex];
          if (currentTeam.throwsByRound.length > 0 && currentTeam.throwsByRound[currentTeam.throwsByRound.length - 1].length === 0) {
              currentTeam.throwsByRound.pop();
          }

          // Revert to the previous team
          game.currentTeamIndex = lastThrowTeamIndex;

          // Revert round increment if needed
          if (game.currentTeamIndex === game.teamData.length - 1 && game.currentRound > 1) {
              game.currentRound--;
          }

          // Revert player rotation
          const nOfPl = lastThrowTeam.playerNames.length;
          lastThrowTeam.currentPlayerIndex = (lastThrowTeam.currentPlayerIndex - 1 + nOfPl) % nOfPl;
      }

      this.logger.log(`Throw rolled back for game ${id}. New current team: ${game.teamData[game.currentTeamIndex].teamName}`);

      return await game.save();
    } catch (error) {
      this.logger.error(`Error rolling back throw: ${error.message}`, error.stack);
      throw error;
    }

  }

  private getTotalScore(throwsByRound: number[][]): number {
    return throwsByRound
      .flat()
      .reduce((total, score) => total + score, 0);
  }

  async delete(id: string): Promise<void> {
    const result = await this.gameModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Game with id ${id} not found for deletion`);
    }
  }

  async switchArchivedState(id: string): Promise<GameDocument> {
    this.isMongoId(id);
    const game = await this.findById(id);
    game.archived = !game.archived;
    return await game.save();
  }

  private isMongoId(id: any): void {
    if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
      this.logger.error(`Invalid MongoDB ID format: ${id}`);
      throw new BadRequestException(`The parameter passed as team id is not valid: '${id}'`);
    }
  }
}