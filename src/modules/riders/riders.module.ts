import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubsModule } from '../hubs/hubs.module';
import { User } from '../users/entities/user.entity';
import { RiderAreaAssignment } from './entities/rider-area-assignment.entity';
import { RiderHubAssignment } from './entities/rider-hub-assignment.entity';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RiderHubAssignment, RiderAreaAssignment]),
    HubsModule,
  ],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService, TypeOrmModule],
})
export class RidersModule {}
