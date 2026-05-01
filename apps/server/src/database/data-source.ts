import { DataSource } from 'typeorm';
import { createMigrationDataSourceOptions } from './typeorm.config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run TypeORM migrations.');
}

export default new DataSource(createMigrationDataSourceOptions(databaseUrl));
