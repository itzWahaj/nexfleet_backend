import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole, UserStatus } from '../../src/common/types/auth';
import { User } from '../../src/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;

  const testUser = {
    phone: '+923009998877',
    password: 'TestPass123!',
    role: UserRole.HUB_ADMIN,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    usersRepository = moduleFixture.get(getRepositoryToken(User));
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    const existing = await usersRepository.findOne({
      where: { phone: testUser.phone },
    });
    if (!existing) {
      await usersRepository.save(
        usersRepository.create({
          phone: testUser.phone,
          passwordHash,
          role: testUser.role,
          status: UserStatus.ACTIVE,
        }),
      );
    }
  });

  afterAll(async () => {
    await usersRepository.delete({ phone: testUser.phone });
    await app.close();
  });

  it('POST /auth/login sets cookies and returns user envelope', async () => {
    const agent = request.agent(app.getHttpServer());

    const response = await agent
      .post('/api/v1/auth/login')
      .send({ phone: testUser.phone, password: testUser.password })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.phone).toBe(testUser.phone);
    expect(response.body.data.user.role).toBe(UserRole.HUB_ADMIN);

    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );

    const me = await agent.get('/api/v1/auth/me').expect(200);
    expect(me.body.data.phone).toBe(testUser.phone);
  });

  it('POST /auth/logout clears the session', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ phone: testUser.phone, password: testUser.password })
      .expect(200);

    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
  });

  it('GET /auth/me without session returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });
});
