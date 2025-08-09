import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { LegModule } from './leg/leg.module';
import { TeamModule } from './team/team.module';
import { ValidationService } from './validation/validation.service';


const uri = 'mongodb://localhost:27017/dartsdbkophase';

@Module({
  imports: [
    MongooseModule.forRoot(uri),
    GameModule,
    LegModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [AppService, ValidationService],
})
export class AppModule {}
