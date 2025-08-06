import { Prop, SchemaFactory, Schema} from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export enum Status {
  ACTIVE = 'active',
  COMPLETE = 'complete',
}

@Schema({ _id: false })
export class TeamData {
    @Prop({ required: true })
    teamName: string;

    @Prop({ required: true })
    playerNames: string[];

    @Prop({ type: [[Number]] })
    throwsByRound: number[][]

    @Prop({ required: true, default: 0 })
    currentPlayerIndex: number;
}

@Schema()
export class Game {

    _id: Types.ObjectId;
    
    @Prop({ required: true, default: 1 })
    currentRound: number;

    @Prop({ required: true, default: 10 })
    roundLimit: number; // Maximum number of rounds per leg

    @Prop({ required: false })
    scoreLimit?: number;

    @Prop({ type: [TeamData], required: true })
    teamData: TeamData[];

    @Prop({ required: true, default: 0 })
    currentTeamIndex: number;

    @Prop({ enum: Status, required: true, default: Status.ACTIVE })
    status: Status;

    @Prop({ required: false })
    gameWinner?: string; // name of the winner team

    @Prop({ required: true, default: false })
    archived: boolean;
}

export const GameSchema = SchemaFactory.createForClass(Game);
export type GameDocument = HydratedDocument<Game>;

