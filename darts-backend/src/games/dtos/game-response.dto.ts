import { Expose, Transform, Type } from 'class-transformer';
import { Status } from '../schemas/game.schema';

export class TeamDataResponseDto {
  @Expose()
  teamName: string;

  @Expose()
  playerNames: string[];

  @Expose()
  throwsByRound: number[][];

  @Expose()
  currentPlayerIndex: number;
}

export class GameResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  currentRound: number;

  @Expose()
  roundLimit: number;

  @Expose()
  scoreLimit?: number;

  @Expose()
  @Type(() => TeamDataResponseDto)
  teamData: TeamDataResponseDto[];

  @Expose()
  currentTeamIndex: number;

  @Expose()
  status: Status;

  @Expose()
  gameWinner?: string;

  @Expose()
  archived: boolean;
}