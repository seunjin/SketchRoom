import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

function createPostgresOptions(databaseUrl: string) {
  const sslRequired =
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('neon.tech');

  return {
    type: 'postgres' as const,
    url: databaseUrl,
    synchronize: false,
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
  };
}

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize TypeORM.');
  }

  return {
    ...createPostgresOptions(databaseUrl),
    autoLoadEntities: true,
  };
}

export function createMigrationDataSourceOptions(
  databaseUrl: string,
): DataSourceOptions {
  return {
    ...createPostgresOptions(databaseUrl),
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
  };
}
