import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { HubScope } from '../../common/types/auth';
import { applyHubScope } from '../../common/utils/hub-scope.util';
import { CreateHubDto, UpdateHubDto } from './dto/create-hub.dto';
import { HubResponseDto } from './dto/hub-response.dto';
import { Hub } from './entities/hub.entity';
import { HubStatus } from './entities/hub.enums';

interface HubRow {
  id: string;
  name: string;
  city: string;
  lng: string;
  lat: string;
  owner_type: string;
  owner_user_id: string | null;
  status: string;
}

@Injectable()
export class HubsService {
  constructor(
    @InjectRepository(Hub)
    private readonly hubsRepository: Repository<Hub>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    hubScope: HubScope | null,
  ): Promise<PaginatedResult<HubResponseDto>> {
    const countQb = this.hubsRepository.createQueryBuilder('hub');
    applyHubScope(countQb, hubScope, 'hub.id');
    const total = await countQb.getCount();

    const qb = this.hubsRepository
      .createQueryBuilder('hub')
      .select('hub.id', 'id')
      .addSelect('hub.name', 'name')
      .addSelect('hub.city', 'city')
      .addSelect('hub.owner_type', 'owner_type')
      .addSelect('hub.owner_user_id', 'owner_user_id')
      .addSelect('hub.status', 'status')
      .addSelect('ST_X(hub.location::geometry)', 'lng')
      .addSelect('ST_Y(hub.location::geometry)', 'lat')
      .orderBy('hub.name', 'ASC');

    applyHubScope(qb, hubScope, 'hub.id');

    const rows = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<HubRow>();

    return paginate(
      rows.map((row) => this.mapRow(row)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    id: string,
    hubScope: HubScope | null,
  ): Promise<HubResponseDto> {
    const qb = this.hubsRepository
      .createQueryBuilder('hub')
      .select('hub.id', 'id')
      .addSelect('hub.name', 'name')
      .addSelect('hub.city', 'city')
      .addSelect('hub.owner_type', 'owner_type')
      .addSelect('hub.owner_user_id', 'owner_user_id')
      .addSelect('hub.status', 'status')
      .addSelect('ST_X(hub.location::geometry)', 'lng')
      .addSelect('ST_Y(hub.location::geometry)', 'lat')
      .where('hub.id = :id', { id });

    applyHubScope(qb, hubScope, 'hub.id');

    const row = await qb.getRawOne<HubRow>();
    if (!row) {
      throw new NotFoundException('Hub not found');
    }
    return this.mapRow(row);
  }

  async create(dto: CreateHubDto): Promise<HubResponseDto> {
    const result = await this.hubsRepository
      .createQueryBuilder()
      .insert()
      .into(Hub)
      .values({
        name: dto.name,
        city: dto.city,
        ownerType: dto.ownerType,
        ownerUserId: dto.ownerUserId ?? null,
        status: dto.status ?? HubStatus.ACTIVE,
        location: () => 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)',
      })
      .setParameters({ lng: dto.location.lng, lat: dto.location.lat })
      .returning('id')
      .execute();

    const id = result.identifiers[0]?.id as string;
    return this.findOne(id, null);
  }

  async update(
    id: string,
    dto: UpdateHubDto,
    hubScope: HubScope | null,
  ): Promise<HubResponseDto> {
    await this.findOne(id, hubScope);

    if (dto.location !== undefined) {
      await this.hubsRepository
        .createQueryBuilder()
        .update(Hub)
        .set({
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          location: () => 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)',
        })
        .where('id = :id', { id })
        .setParameters({ lng: dto.location.lng, lat: dto.location.lat })
        .execute();
    } else {
      await this.hubsRepository.update(
        { id },
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      );
    }

    return this.findOne(id, hubScope);
  }

  async remove(id: string): Promise<void> {
    const hub = await this.hubsRepository.findOne({ where: { id } });
    if (!hub) {
      throw new NotFoundException('Hub not found');
    }
    await this.hubsRepository.delete({ id });
  }

  async getHubIdsForOwner(userId: string): Promise<string[]> {
    const rows = await this.hubsRepository.find({
      where: { ownerUserId: userId, status: HubStatus.ACTIVE },
      select: ['id'],
    });
    return rows.map((row) => row.id);
  }

  async assertHubAccessible(
    hubId: string,
    hubScope: HubScope | null,
  ): Promise<void> {
    try {
      await this.findOne(hubId, hubScope);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException('Hub is outside your assigned scope');
      }
      throw error;
    }
  }

  private mapRow(row: HubRow): HubResponseDto {
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      lng: Number(row.lng),
      lat: Number(row.lat),
      ownerType: row.owner_type as HubResponseDto['ownerType'],
      ownerUserId: row.owner_user_id,
      status: row.status as HubResponseDto['status'],
    };
  }
}
