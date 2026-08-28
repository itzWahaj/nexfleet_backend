import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HubScopeContext } from '../../common/decorators/hub-scope-context.decorator';
import { HubScoped } from '../../common/decorators/hub-scoped.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { HubScope, UserRole } from '../../common/types/auth';
import {
  AssignRiderAreaDto,
  AssignRiderHubDto,
  CreateRiderDto,
  UpdateRiderDto,
} from './dto/rider.dto';
import {
  PaginatedRidersResponseDto,
  RiderAreaAssignmentResponseDto,
  RiderHubAssignmentResponseDto,
  RiderResponseDto,
} from './dto/rider-response.dto';
import { RidersService } from './riders.service';

@ApiTags('riders')
@HubScoped()
@Roles(UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN)
@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedRidersResponseDto })
  findAll(
    @Query() query: PaginationQueryDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<PaginatedRidersResponseDto> {
    return this.ridersService.findAll(query.page, query.limit, hubScope);
  }

  @Get(':id')
  @ApiOkResponse({ type: RiderResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    return this.ridersService.findOne(id, hubScope);
  }

  @Post()
  @ApiCreatedResponse({ type: RiderResponseDto })
  create(
    @Body() dto: CreateRiderDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    return this.ridersService.create(dto, hubScope);
  }

  @Patch(':id')
  @ApiOkResponse({ type: RiderResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRiderDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<RiderResponseDto> {
    return this.ridersService.updateStatus(id, dto, hubScope);
  }

  @Post(':id/hub-assignments')
  @ApiCreatedResponse({ type: RiderHubAssignmentResponseDto })
  assignHub(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRiderHubDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<RiderHubAssignmentResponseDto> {
    return this.ridersService.assignHub(id, dto, hubScope);
  }

  @Post(':id/area-assignments')
  @ApiCreatedResponse({ type: RiderAreaAssignmentResponseDto })
  assignArea(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRiderAreaDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<RiderAreaAssignmentResponseDto> {
    return this.ridersService.assignArea(id, dto, hubScope);
  }
}
