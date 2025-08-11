import { Prop, SchemaFactory, Schema} from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Status } from "src/game/schemas/game.schema";


@Schema({ _id: false })
export class TeamData {
    @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
    teamId: Types.ObjectId;

    @Prop({ required: true })
    nOfPlayers: number;

    @Prop({ type: [[Number]] })
    throwsByRound: number[][]

    @Prop({ required: true, default: 0 })
    currentPlayerIndex: number;
}

@Schema()
export class Leg {

    _id: Types.ObjectId;
    
    @Prop({ type: [TeamData], required: true })
    teamData: TeamData[];

    @Prop({ required: true, default: 0 })
    currentTeamIndex: number;

    @Prop({ required: true, default: 1 })
    currentRound: number;

    @Prop({ required: true, default: 10 })
    roundLimit: number; // Maximum number of rounds per leg

    @Prop({ required: false })
    scoreLimit?: number;

    @Prop({ enum: Status, required: true, default: Status.ACTIVE })
    status: Status;

    @Prop({ required: false })
    @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
    legWinner?: Types.ObjectId; // id of the team that won the leg
}

export const LegSchema = SchemaFactory.createForClass(Leg);
export type LegDocument = HydratedDocument<Leg>;