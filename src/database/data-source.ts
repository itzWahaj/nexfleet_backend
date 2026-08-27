import 'dotenv/config';
import { DataSource } from 'typeorm';
import { typeormCliOptions } from './typeorm.options';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run TypeORM CLI commands');
}

export default new DataSource(
  typeormCliOptions(databaseUrl, process.env.NODE_ENV ?? 'development'),
);
