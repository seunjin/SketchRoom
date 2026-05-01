import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize TypeORM.');
  }

  const sslRequired =
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('neon.tech');

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    synchronize: false,
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
  };
}
