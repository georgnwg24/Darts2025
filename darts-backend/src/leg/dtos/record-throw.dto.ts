import { IsNumber, IsString, Min, Max } from 'class-validator';

export class RecordThrowDto {
  @IsString()
  teamId: string;

  @IsNumber()
  @Min(0)
  @Max(60) // Valid dart score has to be between 0 and 60
  score: number;
}