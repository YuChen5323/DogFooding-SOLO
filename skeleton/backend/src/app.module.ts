import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FossilController } from './controllers/fossil.controller';
import { GameController } from './controllers/game.controller';
import { FossilService } from './services/fossil.service';
import { GameService } from './services/game.service';
import { FossilSchema } from './schemas/fossil.schema';
import { BoneFragmentSchema } from './schemas/bone-fragment.schema';
import { GameSessionSchema } from './schemas/game-session.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'Fossil', schema: FossilSchema },
      { name: 'BoneFragment', schema: BoneFragmentSchema },
      { name: 'GameSession', schema: GameSessionSchema },
    ]),
  ],
  controllers: [FossilController, GameController],
  providers: [FossilService, GameService],
})
export class AppModule {}
