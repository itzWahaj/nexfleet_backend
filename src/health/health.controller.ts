import { Controller, Get, Header, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { HealthLiveResponseDto } from './dto/health-live.response.dto';
import { HealthReadyResponseDto } from './dto/health-ready.response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: HealthLiveResponseDto })
  live(): HealthLiveResponseDto {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Public()
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: HealthReadyResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthReadyResponseDto })
  async ready(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthReadyResponseDto> {
    const data = await this.healthService.ready();
    if (data.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return data;
  }
}
