import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';


const uri = 'mongodb://localhost:27017/dartsdbkophase';

@Module({
  imports: [
    MongooseModule.forRoot(uri),
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
