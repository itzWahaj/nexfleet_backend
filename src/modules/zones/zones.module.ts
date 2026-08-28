import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from './entities/area.entity';
import { Region } from './entities/region.entity';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Region, Area])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService, TypeOrmModule],
})
export class ZonesModule {}
