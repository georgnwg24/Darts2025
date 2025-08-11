import { ArrayMinSize, IsArray, IsInt, IsOptional, Min } from "class-validator";

export class CreateLegDto {
    
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