import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";


export class CreateGameDto {

  @IsInt()
  @Min(1)
  legLimit: number;

  @IsInt()
  @Min(1)
  roundLimit: number;

  @IsOptional()
  @IsInt()
  scoreLimit?: number;

  @IsArray()
  @ArrayMinSize(2)
  teamIds: number[];
}
