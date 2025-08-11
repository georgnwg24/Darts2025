import { Prop, SchemaFactory, Schema} from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export enum Status {
  ACTIVE = 'active',
  COMPLETE = 'complete',
}

@Schema()
export class Game {

    _id: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], required: true })
    teamIds: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Leg' }], required: true, min: 1 })
    legIds: Types.ObjectId[];

    @Prop({ required: true, default: 1 })
    legLimit: number;

    @Prop({ required: true, default: 8 })
    roundLimit: number; // Maximum number of rounds per leg

    @Prop({ required: false })
    scoreLimit?: number;

    @Prop({ enum: Status, required: true, default: Status.ACTIVE })
    status: Status;

    @Prop({ type: Types.ObjectId, ref: 'Team' , required: false })
    gameWinner?: Types.ObjectId; // id of the winner team

    @Prop({ required: true, default: false })
    archived: boolean;
}

export const GameSchema = SchemaFactory.createForClass(Game);
export type GameDocument = HydratedDocument<Game>;

