import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from '../../common/types/auth';
import { HubsService } from '../hubs/hubs.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hubsService: HubsService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findActiveByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone, status: UserStatus.ACTIVE },
    });
  }

  async requireById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getHubIdsForUser(userId: string): Promise<string[]> {
    return this.hubsService.getHubIdsForOwner(userId);
  }
}
