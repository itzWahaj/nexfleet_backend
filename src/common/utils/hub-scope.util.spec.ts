import { ForbiddenException } from '@nestjs/common';
import { applyHubScope, assertHubInScope } from './hub-scope.util';

describe('hub-scope.util', () => {
  it('assertHubInScope throws FORBIDDEN_HUB_SCOPE for out-of-scope hub', () => {
    expect(() => assertHubInScope('hub-2', { hubIds: ['hub-1'] })).toThrow(
      ForbiddenException,
    );
  });

  it('applyHubScope adds IN clause for hub admin', () => {
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
    };
    applyHubScope(qb as never, { hubIds: ['hub-1'] }, 'hub.id');
    expect(qb.andWhere).toHaveBeenCalledWith('hub.id IN (:...scopedHubIds)', {
      scopedHubIds: ['hub-1'],
    });
  });
});
