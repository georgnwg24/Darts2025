import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

export class CreateTeamDataDto {
  @IsString()
  teamName: string; 

  @IsArray()
  playerNames: string[];
}

export class CreateGameDto {

  @IsInt()
  @Min(1)
  roundLimit: number;

  @IsOptional()
  @IsInt()
  scoreLimit?: number;

  @ArrayMinSize(1)
  teamData: CreateTeamDataDto[];
}
