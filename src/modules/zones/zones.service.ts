import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { GeoJsonPolygonDto } from '../../common/dto/geo.dto';
import { AreaResponseDto, RegionResponseDto } from './dto/zone-response.dto';
import {
  CreateAreaDto,
  CreateRegionDto,
  UpdateAreaDto,
  UpdateRegionDto,
} from './dto/zone.dto';
import { Area } from './entities/area.entity';
import { Region } from './entities/region.entity';

interface RegionRow {
  id: string;
  city: string;
  name: string;
  boundary: GeoJsonPolygonDto;
}

interface AreaRow {
  id: string;
  region_id: string;
  name: string;
  boundary: GeoJsonPolygonDto;
}

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
    @InjectRepository(Area)
    private readonly areasRepository: Repository<Area>,
  ) {}

  async findRegions(
    page: number,
    limit: number,
    city?: string,
  ): Promise<PaginatedResult<RegionResponseDto>> {
    const countQb = this.regionsRepository.createQueryBuilder('region');
    if (city) {
      countQb.andWhere('region.city ILIKE :city', { city: `%${city}%` });
    }
    const total = await countQb.getCount();

    const rowsQb = this.regionsRepository
      .createQueryBuilder('region')
      .select('region.id', 'id')
      .addSelect('region.city', 'city')
      .addSelect('region.name', 'name')
      .addSelect('ST_AsGeoJSON(region.boundary::geometry)::json', 'boundary')
      .orderBy('region.name', 'ASC');
    if (city) {
      rowsQb.andWhere('region.city ILIKE :city', { city: `%${city}%` });
    }

    const rows = await rowsQb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<RegionRow>();

    return paginate(
      rows.map((row) => this.mapRegionRow(row)),
      total,
      page,
      limit,
    );
  }

  async findRegion(id: string): Promise<RegionResponseDto> {
    const row = await this.regionsRepository
      .createQueryBuilder('region')
      .select('region.id', 'id')
      .addSelect('region.city', 'city')
      .addSelect('region.name', 'name')
      .addSelect('ST_AsGeoJSON(region.boundary::geometry)::json', 'boundary')
      .where('region.id = :id', { id })
      .getRawOne<RegionRow>();

    if (!row) {
      throw new NotFoundException('Region not found');
    }
    return this.mapRegionRow(row);
  }

  async createRegion(dto: CreateRegionDto): Promise<RegionResponseDto> {
    const result = await this.regionsRepository
      .createQueryBuilder()
      .insert()
      .into(Region)
      .values({
        city: dto.city,
        name: dto.name,
        boundary: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:boundaryJson), 4326)',
      })
      .setParameters({ boundaryJson: JSON.stringify(dto.boundary) })
      .returning('id')
      .execute();

    return this.findRegion(result.identifiers[0]?.id as string);
  }

  async updateRegion(
    id: string,
    dto: UpdateRegionDto,
  ): Promise<RegionResponseDto> {
    await this.findRegion(id);

    if (dto.boundary !== undefined) {
      await this.regionsRepository
        .createQueryBuilder()
        .update(Region)
        .set({
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          boundary: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:boundaryJson), 4326)',
        })
        .where('id = :id', { id })
        .setParameters({ boundaryJson: JSON.stringify(dto.boundary) })
        .execute();
    } else {
      await this.regionsRepository.update(
        { id },
        {
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
        },
      );
    }

    return this.findRegion(id);
  }

  async findAreasByRegion(
    regionId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<AreaResponseDto>> {
    await this.findRegion(regionId);

    const countQb = this.areasRepository
      .createQueryBuilder('area')
      .where('area.region_id = :regionId', { regionId });
    const total = await countQb.getCount();

    const rows = await this.areasRepository
      .createQueryBuilder('area')
      .select('area.id', 'id')
      .addSelect('area.region_id', 'region_id')
      .addSelect('area.name', 'name')
      .addSelect('ST_AsGeoJSON(area.boundary::geometry)::json', 'boundary')
      .where('area.region_id = :regionId', { regionId })
      .orderBy('area.name', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<AreaRow>();

    return paginate(
      rows.map((row) => this.mapAreaRow(row)),
      total,
      page,
      limit,
    );
  }

  async findArea(id: string): Promise<AreaResponseDto> {
    const row = await this.areasRepository
      .createQueryBuilder('area')
      .select('area.id', 'id')
      .addSelect('area.region_id', 'region_id')
      .addSelect('area.name', 'name')
      .addSelect('ST_AsGeoJSON(area.boundary::geometry)::json', 'boundary')
      .where('area.id = :id', { id })
      .getRawOne<AreaRow>();

    if (!row) {
      throw new NotFoundException('Area not found');
    }
    return this.mapAreaRow(row);
  }

  async createArea(
    regionId: string,
    dto: CreateAreaDto,
  ): Promise<AreaResponseDto> {
    await this.findRegion(regionId);

    const result = await this.areasRepository
      .createQueryBuilder()
      .insert()
      .into(Area)
      .values({
        regionId,
        name: dto.name,
        boundary: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:boundaryJson), 4326)',
      })
      .setParameters({ boundaryJson: JSON.stringify(dto.boundary) })
      .returning('id')
      .execute();

    return this.findArea(result.identifiers[0]?.id as string);
  }

  async updateArea(id: string, dto: UpdateAreaDto): Promise<AreaResponseDto> {
    await this.findArea(id);

    if (dto.boundary !== undefined) {
      await this.areasRepository
        .createQueryBuilder()
        .update(Area)
        .set({
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          boundary: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:boundaryJson), 4326)',
        })
        .where('id = :id', { id })
        .setParameters({ boundaryJson: JSON.stringify(dto.boundary) })
        .execute();
    } else {
      await this.areasRepository.update(
        { id },
        { ...(dto.name !== undefined ? { name: dto.name } : {}) },
      );
    }

    return this.findArea(id);
  }

  async findAreaContainingPoint(
    lng: number,
    lat: number,
  ): Promise<string | null> {
    const row = await this.areasRepository
      .createQueryBuilder('area')
      .select('area.id', 'id')
      .where(
        'ST_Contains(area.boundary, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
      )
      .setParameters({ lng, lat })
      .limit(1)
      .getRawOne<{ id: string }>();

    return row?.id ?? null;
  }

  private mapRegionRow(row: RegionRow): RegionResponseDto {
    return {
      id: row.id,
      city: row.city,
      name: row.name,
      boundary: row.boundary,
    };
  }

  private mapAreaRow(row: AreaRow): AreaResponseDto {
    return {
      id: row.id,
      regionId: row.region_id,
      name: row.name,
      boundary: row.boundary,
    };
  }
}
