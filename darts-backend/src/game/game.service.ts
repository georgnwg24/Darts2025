import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Game, GameDocument, Status } from "./schemas/game.schema";
import { Model } from "mongoose";
import { CreateGameDto } from "./dtos/create-game.dto";
import { ValidationService } from "src/validation/validation.service";
import { LegService } from "src/leg/leg.service";

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private legService: LegService,
    private validationService: ValidationService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameDocument> {    
    // Create initial leg
    const initialLeg = await this.legService.createLeg(
      createGameDto.roundLimit,
      createGameDto.teamIds,
      createGameDto.scoreLimit
    );
 
    // Create game
    const game = new this.gameModel({
      teamIds: createGameDto.teamIds,
      legIds: [initialLeg],
      legLimit: createGameDto.legLimit,
      roundLimit: createGameDto.roundLimit,
      scoreLimit: createGameDto.scoreLimit,
      status: Status.ACTIVE,
    });

    return game.save();
  }

  async findById(id: string): Promise<GameDocument> {
    this.logger.debug(`Finding game by ID: ${id}`);
    this.validationService.isMongoId(id);
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

  async handleLegCompletion(id: string): Promise<GameDocument> {
    const game = await this.findById(id);

    // TODO
    // Determine game winner, if there is none, create a new leg and make the last one permanent.

    return await game.save();
  }

  async switchArchivedState(id: string): Promise<GameDocument> {
    const game = await this.findById(id);
    game.archived = !game.archived;
    return await game.save();
  }

  async delete(id: string): Promise<void> {
    const game = this.findById(id);
    for (const legId in (await game).legIds) {
      this.legService.delete(legId);
    }
    const result = await this.gameModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Game with id ${id} not found for deletion`);
    }
  }
}