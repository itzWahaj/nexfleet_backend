import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HubScope } from '../../common/types/auth';
import { Hub } from './entities/hub.entity';
import { HubOwnerType, HubStatus } from './entities/hub.enums';
import { HubsService } from './hubs.service';

describe('HubsService', () => {
  const createQueryBuilder = jest.fn();
  const hubsRepository = {
    createQueryBuilder,
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  } as unknown as Repository<Hub>;

  const service = new HubsService(hubsRepository);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getHubIdsForOwner returns active hub ids for owner', async () => {
    (hubsRepository.find as jest.Mock).mockResolvedValue([
      { id: 'hub-1' },
      { id: 'hub-2' },
    ]);

    await expect(service.getHubIdsForOwner('user-1')).resolves.toEqual([
      'hub-1',
      'hub-2',
    ]);
    expect(hubsRepository.find).toHaveBeenCalledWith({
      where: { ownerUserId: 'user-1', status: HubStatus.ACTIVE },
      select: ['id'],
    });
  });

  it('findOne throws when hub is outside scope', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
    };
    createQueryBuilder.mockReturnValue(qb);

    const scope: HubScope = { hubIds: ['hub-1'] };
    await expect(service.findOne('hub-999', scope)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create inserts hub with PostGIS point parameters', async () => {
    const insertQb = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 'hub-1' }] }),
    };
    const readQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        id: 'hub-1',
        name: 'Test Hub',
        city: 'Karachi',
        lng: '67.01',
        lat: '24.86',
        owner_type: HubOwnerType.COMPANY,
        owner_user_id: null,
        status: HubStatus.ACTIVE,
      }),
    };
    createQueryBuilder
      .mockReturnValueOnce(insertQb)
      .mockReturnValueOnce(readQb);

    const result = await service.create({
      name: 'Test Hub',
      city: 'Karachi',
      location: { lng: 67.01, lat: 24.86 },
      ownerType: HubOwnerType.COMPANY,
    });

    expect(insertQb.setParameters).toHaveBeenCalledWith({
      lng: 67.01,
      lat: 24.86,
    });
    expect(result.id).toBe('hub-1');
  });
});
