import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hub } from './entities/hub.entity';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hub])],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService, TypeOrmModule],
})
export class HubsModule {}
