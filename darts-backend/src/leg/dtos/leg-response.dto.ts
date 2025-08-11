import { Expose, Transform, Type } from "class-transformer";
import { Status } from "src/game/schemas/game.schema";

export class TeamDataResponseDto {
  @Expose()
  teamId: string;

  @Expose()
  nOfPlayers: number;

  @Expose()
  throwsByRound: number[][];

  @Expose()
  currentPlayerIndex: number;
}

export class LegResponseDto {
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
}