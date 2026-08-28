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
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/types/auth';
import {
  AreaResponseDto,
  PaginatedAreasResponseDto,
  PaginatedRegionsResponseDto,
  RegionResponseDto,
} from './dto/zone-response.dto';
import {
  CreateAreaDto,
  CreateRegionDto,
  UpdateAreaDto,
  UpdateRegionDto,
} from './dto/zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@Roles(UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN)
@Controller()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get('regions')
  @ApiOkResponse({ type: PaginatedRegionsResponseDto })
  findRegions(
    @Query() query: PaginationQueryDto,
    @Query('city') city?: string,
  ): Promise<PaginatedRegionsResponseDto> {
    return this.zonesService.findRegions(query.page, query.limit, city);
  }

  @Post('regions')
  @ApiCreatedResponse({ type: RegionResponseDto })
  createRegion(@Body() dto: CreateRegionDto): Promise<RegionResponseDto> {
    return this.zonesService.createRegion(dto);
  }

  @Get('regions/:id')
  @ApiOkResponse({ type: RegionResponseDto })
  findRegion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RegionResponseDto> {
    return this.zonesService.findRegion(id);
  }

  @Patch('regions/:id')
  @ApiOkResponse({ type: RegionResponseDto })
  updateRegion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
  ): Promise<RegionResponseDto> {
    return this.zonesService.updateRegion(id, dto);
  }

  @Get('regions/:regionId/areas')
  @ApiOkResponse({ type: PaginatedAreasResponseDto })
  findAreas(
    @Param('regionId', ParseUUIDPipe) regionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedAreasResponseDto> {
    return this.zonesService.findAreasByRegion(
      regionId,
      query.page,
      query.limit,
    );
  }

  @Post('regions/:regionId/areas')
  @ApiCreatedResponse({ type: AreaResponseDto })
  createArea(
    @Param('regionId', ParseUUIDPipe) regionId: string,
    @Body() dto: CreateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.zonesService.createArea(regionId, dto);
  }

  @Get('areas/:id')
  @ApiOkResponse({ type: AreaResponseDto })
  findArea(@Param('id', ParseUUIDPipe) id: string): Promise<AreaResponseDto> {
    return this.zonesService.findArea(id);
  }

  @Patch('areas/:id')
  @ApiOkResponse({ type: AreaResponseDto })
  updateArea(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.zonesService.updateArea(id, dto);
  }
}
