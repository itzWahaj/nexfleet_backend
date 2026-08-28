import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../../common/types/auth';
import { HubOwnerType, HubStatus } from '../../modules/hubs/entities/hub.enums';
import { User } from '../../modules/users/entities/user.entity';
import dataSource from '../data-source';

const SUPER_ADMIN = {
  phone: '+923001234567',
  password: 'Admin123!',
  role: UserRole.SUPER_ADMIN,
};

const HUB_ADMIN = {
  phone: '+923009876543',
  password: 'HubAdmin123!',
  role: UserRole.HUB_ADMIN,
};

async function seed(): Promise<void> {
  const connection = dataSource.isInitialized
    ? dataSource
    : await dataSource.initialize();

  try {
    const usersRepo = connection.getRepository(User);

    for (const account of [SUPER_ADMIN, HUB_ADMIN]) {
      const existing = await usersRepo.findOne({
        where: { phone: account.phone },
      });
      if (existing) {
        continue;
      }
      const passwordHash = await bcrypt.hash(account.password, 12);
      await usersRepo.save(
        usersRepo.create({
          phone: account.phone,
          passwordHash,
          role: account.role,
          status: UserStatus.ACTIVE,
        }),
      );
      console.log(`Seeded ${account.role} ${account.phone}`);
    }

    const hubAdmin = await usersRepo.findOne({
      where: { phone: HUB_ADMIN.phone },
    });
    if (!hubAdmin) {
      return;
    }

    const hubExists = (await connection.query(
      `SELECT id FROM hubs WHERE name = $1 LIMIT 1`,
      ['Karachi Franchise Hub'],
    )) as Array<{ id: string }>;

    if (hubExists.length === 0) {
      await connection.query(
        `INSERT INTO hubs (name, city, location, owner_type, owner_user_id, status)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7)`,
        [
          'Karachi Franchise Hub',
          'Karachi',
          67.01,
          24.86,
          HubOwnerType.FRANCHISE,
          hubAdmin.id,
          HubStatus.ACTIVE,
        ],
      );
      console.log('Seeded franchise hub for hub admin');
    }
  } finally {
    await connection.destroy();
  }
}

void seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
