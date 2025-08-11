import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Leg, LegDocument, TeamData } from './schemas/leg.schema';
import { Model, Types } from 'mongoose';
import { ValidationService } from 'src/validation/validation.service';
import { TeamService } from 'src/team/team.service';
import { CreateLegDto } from './dtos/create-leg.dto';
import { Status } from 'src/game/schemas/game.schema';
import { RecordThrowDto } from './dtos/record-throw.dto';

@Injectable()
export class LegService {
    private readonly logger = new Logger(LegService.name);

    constructor(
        @InjectModel(Leg.name) private legModel: Model<LegDocument>,
        private teamService: TeamService,
        private validationService: ValidationService, 
    ) {}

  async createLeg(createLegDto: CreateLegDto): Promise<LegDocument> {
    this.logger.log(`Creating leg: ${JSON.stringify(createLegDto)}`);
    try {
      const teamData: TeamData[] = [];
      for (const teamId of createLegDto.teamIds) {
        const team = await this.teamService.findById(teamId.toString());
        teamData.push({
          teamId: team.id,
          nOfPlayers: team.players.length,
          throwsByRound: [[]],
          currentPlayerIndex: 0,
        });
      }

      const leg = new this.legModel({
        currentRound: 1,
        roundLimit: createLegDto.roundLimit,
        scoreLimit: createLegDto.scoreLimit,
        teamData,
        currentTeamIndex: 0,
        status: Status.ACTIVE,
      });
      this.logger.log(`Leg created with ID: ${leg.id}`);
      return await leg.save();
    } catch (error) {
      this.logger.error(`Failed to create leg: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<LegDocument> {
    this.logger.debug(`Finding leg by ID: ${id}`);
    this.validationService.isMongoId(id);
    try {
      const leg = await this.legModel.findById(id).exec();
      if (!leg) {
        this.logger.warn(`Leg not found: ${id}`);
        throw new NotFoundException(`Leg with ID ${id} not found`);
      }
      return leg;
    } catch (error) {
      this.logger.error(`Error finding leg ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async recordThrow(id: string, recordThrowDto: RecordThrowDto): Promise<LegDocument> {
    this.logger.log(`Recording throw for leg ${id}: ${JSON.stringify(recordThrowDto)}`);
    try { 
      const leg = await this.findById(id);

      if(recordThrowDto.teamId != leg.teamData[leg.currentTeamIndex].teamId.toString()) {
        throw new BadRequestException(`It's not team ${recordThrowDto.teamId}'s turn`);
      }

      if (leg.legWinner) {
        throw new BadRequestException(`Throw can not be recorded. Leg ${id} already has a winner: ${leg.legWinner}`)
      }

      const currentTeamData = leg.teamData[leg.currentTeamIndex];
      const currentRoundThrows = currentTeamData.throwsByRound[currentTeamData.throwsByRound.length -1];

      if (!currentRoundThrows) {
        throw new BadRequestException('No active round for the team');
      }

      if (currentRoundThrows.length === 3) {
        throw new BadRequestException('The team has already thrown 3 times in this round.');
      }

      const newScore = this.getTotalScore(currentTeamData.throwsByRound) + recordThrowDto.score;

      if (leg.scoreLimit) {
        if (newScore > leg.scoreLimit) { // Overthrow
          this.logger.log(`Overthrow detected for team ${recordThrowDto.teamId}`);
          const currentRoundSum = currentRoundThrows.reduce((sum, score) => sum + score, 0);
          currentRoundThrows.push(-currentRoundSum);
          await this.completeTurn(leg, currentTeamData);
          return await leg.save();
        } else if (newScore === leg.scoreLimit) {
          this.logger.log(`Team ${currentTeamData.teamId} won the leg!`);
          currentRoundThrows.push(recordThrowDto.score);
          leg.legWinner = currentTeamData.teamId;
          leg.status = Status.COMPLETE;
          return await leg.save();
        }
      }

      currentRoundThrows.push(recordThrowDto.score);
      if (currentRoundThrows.length === 3) {
        await this.completeTurn(leg, currentTeamData);
      }
      return await leg.save();
    } catch (error) {
      this.logger.error(`Error recording throw: ${error.message}`, error.stack);
      throw error;
    } 
  }

  private async completeTurn(leg: LegDocument, currentTeamData: TeamData): Promise<void> {
    this.logger.debug(`Completing turn for team ${currentTeamData.teamId} in leg ${leg.id}`);
    currentTeamData.currentPlayerIndex = (currentTeamData.currentPlayerIndex + 1) % currentTeamData.nOfPlayers;
    const nOfTeams = leg.teamData.length;
    if (leg.currentTeamIndex === nOfTeams -1) { // Last team completed turn - advance round
      this.logger.log(`Advancing to round ${leg.currentRound}`);
      leg.currentRound++;

      if (leg.roundLimit < leg.currentRound) { // TODO: What do do in a game with scorelimit?
        await this.setRoundLimitWinner(leg);
        return;
      }
    }

    leg.currentTeamIndex = (leg.currentTeamIndex +1) % nOfTeams;
    leg.teamData[leg.currentTeamIndex].throwsByRound.push([]); // Add an empty array for the next teams throws
  }

  private async setRoundLimitWinner(leg: LegDocument): Promise<void> {
    this.logger.log(`Determining round limit winner for leg ${leg.id}`);
    let maxScore = -1;
    let winningTeam: Types.ObjectId | undefined = undefined;

    for (const teamData of leg.teamData) {
      const totalScore = this.getTotalScore(teamData.throwsByRound);
      if (totalScore > maxScore) {
        maxScore = totalScore;
        winningTeam = teamData.teamId;
      } else if (totalScore === maxScore) {
        winningTeam = undefined; // Tie - no winner yet
      }
    }

    if (winningTeam) {
      leg.legWinner = winningTeam;
      this.logger.log(`Round limit winner: ${winningTeam}`);
    } else {
      this.logger.log(`No clear winner - tie detected`);
    }
    leg.status = Status.COMPLETE;
    await leg.save();
    return;
  }

  async rollbackThrow(id: string): Promise<LegDocument> {
    this.logger.log(`Rolling back last throw for leg ${id}`);
    try {
      const leg = await this.findById(id);

      leg.legWinner = undefined; // Reset winner
      leg.status = Status.ACTIVE;

      let lastThrowTeamIndex = -1;
      let lastRoundIndex = -1;

      // Iterate backwards from the current team index to find the team that made the last throw.
      for (let i = 0; i < leg.teamData.length; i++) {
          const teamIndex = (leg.currentTeamIndex - i + leg.teamData.length) % leg.teamData.length;
          const teamData = leg.teamData[teamIndex];
          
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
      const lastThrowTeam = leg.teamData[lastThrowTeamIndex];
      const lastRound = lastThrowTeam.throwsByRound[lastRoundIndex];
      lastRound.pop();

      // If the last throw was not made by the current team, we need to revert the leg state.
      if (lastThrowTeamIndex !== leg.currentTeamIndex) {
          // Remove the empty round from the current team
          const currentTeam = leg.teamData[leg.currentTeamIndex];
          if (currentTeam.throwsByRound.length > 0 && currentTeam.throwsByRound[currentTeam.throwsByRound.length - 1].length === 0) {
              currentTeam.throwsByRound.pop();
          }

          // Revert to the previous team
          leg.currentTeamIndex = lastThrowTeamIndex;

          // Revert round increment if needed
          if (leg.currentTeamIndex === leg.teamData.length - 1 && leg.currentRound > 1) {
              leg.currentRound--;
          }

          // Revert player rotation
          lastThrowTeam.currentPlayerIndex = (lastThrowTeam.currentPlayerIndex - 1 + lastThrowTeam.nOfPlayers) % lastThrowTeam.nOfPlayers;
      }

      this.logger.log(`Throw rolled back for leg ${id}. New current team: ${leg.currentTeamIndex}`);

      return await leg.save();
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
    const result = await this.legModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Leg with id ${id} not found for deletion`);
    }
  }
}
