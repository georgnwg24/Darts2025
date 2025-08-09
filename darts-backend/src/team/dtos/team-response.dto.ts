import { Exclude, Expose, Transform } from "class-transformer";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

@Exclude()
export class TeamResponseDto {
  @IsNotEmpty()
  @IsString()
  @Expose() 
  @Transform(({value}) => value.toString(), {toPlainOnly: true})
  _id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @Expose()
  players: string[];
}