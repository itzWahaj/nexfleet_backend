import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HubScopeContext } from '../../common/decorators/hub-scope-context.decorator';
import { HubScoped } from '../../common/decorators/hub-scoped.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuthenticatedUser, HubScope, UserRole } from '../../common/types/auth';
import {
  PaginatedWalletTransactionsResponseDto,
  TopUpWalletDto,
  TopUpWalletResponseDto,
  WalletResponseDto,
} from './dto/wallet.dto';
import { WalletOwnerType } from './entities/wallet.enums';
import { WalletService } from './wallet.service';

@ApiTags('wallets')
@HubScoped()
@Roles(UserRole.SUPER_ADMIN, UserRole.HUB_ADMIN)
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('owner/:ownerType/:ownerId')
  @ApiOkResponse({ type: WalletResponseDto })
  findByOwner(
    @Param('ownerType', new ParseEnumPipe(WalletOwnerType))
    ownerType: WalletOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<WalletResponseDto> {
    return this.walletService.findByOwner(ownerType, ownerId, hubScope);
  }

  @Get(':id/transactions')
  @ApiOkResponse({ type: PaginatedWalletTransactionsResponseDto })
  listTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<PaginatedWalletTransactionsResponseDto> {
    return this.walletService.listTransactions(
      id,
      query.page,
      query.limit,
      hubScope,
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: WalletResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<WalletResponseDto> {
    return this.walletService.findById(id, hubScope);
  }

  @Post(':id/top-up')
  @ApiCreatedResponse({ type: TopUpWalletResponseDto })
  topUp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TopUpWalletDto,
    @CurrentUser() user: AuthenticatedUser,
    @HubScopeContext() hubScope: HubScope | null,
  ): Promise<TopUpWalletResponseDto> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.walletService.topUpHubWallet(
        id,
        dto.amount,
        user.userId,
        hubScope,
      );
    }

    return this.walletService.topUpRiderWallet(
      id,
      dto.amount,
      user.userId,
      hubScope,
      dto.hubId,
    );
  }
}
