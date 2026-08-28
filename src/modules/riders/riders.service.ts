import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { HubScope, UserRole, UserStatus } from '../../common/types/auth';
import { assertHubInScope } from '../../common/utils/hub-scope.util';
import { HubsService } from '../hubs/hubs.service';
import { User } from '../users/entities/user.entity';
import {
  AssignRiderAreaDto,
  AssignRiderHubDto,
  CreateRiderDto,
  UpdateRiderDto,
} from './dto/rider.dto';
import {
  RiderAreaAssignmentResponseDto,
  RiderHubAssignmentResponseDto,
  RiderResponseDto,
} from './dto/rider-response.dto';
import { RiderAreaAssignment } from './entities/rider-area-assignment.entity';
import { RiderHubAssignment } from './entities/rider-hub-assignment.entity';
import { RiderHubAssignmentStatus } from './entities/rider.enums';

@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RiderHubAssignment)
    private readonly riderHubRepository: Repository<RiderHubAssignment>,
    @InjectRepository(RiderAreaAssignment)
    private readonly riderAreaRepository: Repository<RiderAreaAssignment>,
    private readonly hubsService: HubsService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    hubScope: HubScope | null,
  ): Promise<PaginatedResult<RiderResponseDto>> {
    if (
      hubScope !== null &&
      hubScope !== undefined &&
      hubScope.hubIds.length === 0
    ) {
      return paginate([], 0, page, limit);
    }

    const countQb = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(RiderHubAssignment, 'rha', 'rha.rider_id = user.id')
      .where('user.role = :role', { role: UserRole.RIDER });

    const listQb = this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .innerJoin(RiderHubAssignment, 'rha', 'rha.rider_id = user.id')
      .where('user.role = :role', { role: UserRole.RIDER });

    if (hubScope !== null && hubScope !== undefined) {
      countQb.andWhere('rha.hub_id IN (:...scopedHubIds)', {
        scopedHubIds: hubScope.hubIds,
      });
      listQb.andWhere('rha.hub_id IN (:...scopedHubIds)', {
        scopedHubIds: hubScope.hubIds,
      });
    }

    const totalRow = await countQb
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRow?.count ?? 0);

    const riderIds = await listQb
      .groupBy('user.id')
      .addGroupBy('user.phone')
      .orderBy('user.phone', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const items = await Promise.all(
      riderIds.map((row) => this.buildRiderResponse(row.id)),
    );

    return paginate(items, total, page, limit);
  }

  async findOne(
    id: string,
    hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id, role: UserRole.RIDER },
    });
    if (!user) {
      throw new NotFoundException('Rider not found');
    }
    await this.assertRiderInScope(id, hubScope);
    return this.buildRiderResponse(id);
  }

  async create(
    dto: CreateRiderDto,
    hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    await this.hubsService.assertHubAccessible(dto.hubId, hubScope);
    assertHubInScope(dto.hubId, hubScope);

    const existing = await this.usersRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        phone: dto.phone,
        passwordHash,
        role: UserRole.RIDER,
        status: UserStatus.ACTIVE,
      }),
    );

    await this.riderHubRepository.save(
      this.riderHubRepository.create({
        riderId: user.id,
        hubId: dto.hubId,
        isHomeHub: dto.isHomeHub ?? true,
        status: RiderHubAssignmentStatus.ACTIVE,
      }),
    );

    return this.buildRiderResponse(user.id);
  }

  async updateStatus(
    id: string,
    dto: UpdateRiderDto,
    hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    await this.findOne(id, hubScope);
    if (dto.status !== undefined) {
      await this.usersRepository.update({ id }, { status: dto.status });
    }
    return this.buildRiderResponse(id);
  }

  async assignHub(
    riderId: string,
    dto: AssignRiderHubDto,
    hubScope: HubScope | null,
  ): Promise<RiderHubAssignmentResponseDto> {
    await this.findOne(riderId, hubScope);
    await this.hubsService.assertHubAccessible(dto.hubId, hubScope);
    assertHubInScope(dto.hubId, hubScope);

    const existing = await this.riderHubRepository.findOne({
      where: { riderId, hubId: dto.hubId },
    });
    if (existing) {
      throw new ConflictException('Rider is already assigned to this hub');
    }

    const assignment = await this.riderHubRepository.save(
      this.riderHubRepository.create({
        riderId,
        hubId: dto.hubId,
        isHomeHub: dto.isHomeHub ?? false,
        status: dto.status ?? RiderHubAssignmentStatus.ACTIVE,
      }),
    );

    return this.mapHubAssignment(assignment);
  }

  async assignArea(
    riderId: string,
    dto: AssignRiderAreaDto,
    hubScope: HubScope | null,
  ): Promise<RiderAreaAssignmentResponseDto> {
    await this.findOne(riderId, hubScope);

    const existing = await this.riderAreaRepository.findOne({
      where: { riderId, areaId: dto.areaId },
    });
    if (existing) {
      throw new ConflictException('Rider is already assigned to this area');
    }

    const assignment = await this.riderAreaRepository.save(
      this.riderAreaRepository.create({
        riderId,
        areaId: dto.areaId,
      }),
    );

    return this.mapAreaAssignment(assignment);
  }

  private async assertRiderInScope(
    riderId: string,
    hubScope: HubScope | null,
  ): Promise<void> {
    if (hubScope === null || hubScope === undefined) {
      return;
    }
    if (hubScope.hubIds.length === 0) {
      throw new ForbiddenException('Rider is outside your assigned scope');
    }

    const match = await this.riderHubRepository
      .createQueryBuilder('rha')
      .where('rha.rider_id = :riderId', { riderId })
      .andWhere('rha.hub_id IN (:...scopedHubIds)', {
        scopedHubIds: hubScope.hubIds,
      })
      .getOne();

    if (!match) {
      throw new ForbiddenException('Rider is outside your assigned scope');
    }
  }

  private async buildRiderResponse(riderId: string): Promise<RiderResponseDto> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: riderId, role: UserRole.RIDER },
    });
    const hubAssignments = await this.riderHubRepository.find({
      where: { riderId },
      order: { isHomeHub: 'DESC' },
    });
    const areaAssignments = await this.riderAreaRepository.find({
      where: { riderId },
      order: { assignedAt: 'DESC' },
    });

    return {
      id: user.id,
      phone: user.phone,
      status: user.status,
      hubAssignments: hubAssignments.map((item) => this.mapHubAssignment(item)),
      areaAssignments: areaAssignments.map((item) =>
        this.mapAreaAssignment(item),
      ),
    };
  }

  private mapHubAssignment(
    assignment: RiderHubAssignment,
  ): RiderHubAssignmentResponseDto {
    return {
      id: assignment.id,
      hubId: assignment.hubId,
      isHomeHub: assignment.isHomeHub,
      status: assignment.status,
    };
  }

  private mapAreaAssignment(
    assignment: RiderAreaAssignment,
  ): RiderAreaAssignmentResponseDto {
    return {
      id: assignment.id,
      areaId: assignment.areaId,
      assignedAt: assignment.assignedAt.toISOString(),
    };
  }
}
