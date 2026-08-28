import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../errors/error-codes';
import { HubScope } from '../types/auth';

export function applyHubScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  hubScope: HubScope | null | undefined,
  column: string,
): SelectQueryBuilder<T> {
  if (hubScope === null || hubScope === undefined) {
    return qb;
  }
  if (hubScope.hubIds.length === 0) {
    return qb.andWhere('1 = 0');
  }
  return qb.andWhere(`${column} IN (:...scopedHubIds)`, {
    scopedHubIds: hubScope.hubIds,
  });
}

export function assertHubInScope(
  hubId: string,
  hubScope: HubScope | null | undefined,
): void {
  if (hubScope === null || hubScope === undefined) {
    return;
  }
  if (!hubScope.hubIds.includes(hubId)) {
    throw new ForbiddenException({
      code: ErrorCode.FORBIDDEN_HUB_SCOPE,
      message: 'Hub is outside your assigned scope',
    });
  }
}
