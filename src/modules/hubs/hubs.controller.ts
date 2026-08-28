import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateHubDto, UpdateHubDto } from './dto/create-hub.dto';
import {
  HubResponseDto,
  PaginatedHubsResponseDto,
} from './dto/hub-response.dto';
import { HubsService } from './hubs.service';

@ApiTags('hubs')
@HubScoped()
@Roles(UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN)
@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedHubsResponseDto })
  findAll(
    @Query() query: PaginationQueryDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<PaginatedHubsResponseDto> {
    return this.hubsService.findAll(query.page, query.limit, hubScope);
  }

  @Get(':id')
  @ApiOkResponse({ type: HubResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<HubResponseDto> {
    return this.hubsService.findOne(id, hubScope);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiCreatedResponse({ type: HubResponseDto })
  create(@Body() dto: CreateHubDto): Promise<HubResponseDto> {
    return this.hubsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: HubResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHubDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<HubResponseDto> {
    return this.hubsService.update(id, dto, hubScope);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.hubsService.remove(id);
  }
}
