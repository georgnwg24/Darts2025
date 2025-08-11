import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dtos/create-game.dto';
import { plainToInstance } from 'class-transformer';
import { GameResponseDto } from './dtos/game-response.dto';

@Controller('games')
export class GameController {
  constructor(
    private gameService: GameService,
  ) {}

  @Post()
  async create(
    @Body() createGameDto: CreateGameDto
  ): Promise<GameResponseDto> {
    const createdGame = await this.gameService.createGame(createGameDto);
    return plainToInstance(GameResponseDto, createdGame.toObject());
  }

  @Get(':id')
  async findById(
    @Param('id') id: string
  ): Promise<GameResponseDto> {
    const game = await this.gameService.findById(id);
    return plainToInstance(GameResponseDto, game.toObject());
  }

  @Get()
  async findAll(
  ): Promise<GameResponseDto[]> {
    const allGames = await this.gameService.findAll();
    return allGames.map(game => plainToInstance(GameResponseDto, game.toObject()));
  }

  @Patch(':id')
  async handleLegCompletion(
    @Param('id') id: string
  ): Promise<GameResponseDto> {
    const updatedGame = await this.gameService.handleLegCompletion(id);
    return plainToInstance(GameResponseDto, updatedGame.toObject());
  }

  @Patch('archive/:id')
  async switchArchivedState(
    @Param('id') id: string
  ): Promise<GameResponseDto> {
    const updatedGame = await this.gameService.switchArchivedState(id);
    return plainToInstance(GameResponseDto, updatedGame.toObject());
  }  

  @Delete(':id')
  async remove(
    @Param('id') id: string
  ): Promise<void> {
    await this.gameService.delete(id);
  }
}
