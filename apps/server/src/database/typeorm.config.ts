import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

// 서버 실행과 migration CLI가 공통으로 쓰는 PostgreSQL 기본 설정입니다.
function createPostgresOptions(databaseUrl: string) {
  // Neon 같은 운영 DB는 SSL 연결이 필요하므로 URL 기준으로 SSL 사용 여부를 판단합니다.
  const sslRequired =
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('neon.tech');

  return {
    type: 'postgres' as const,
    url: databaseUrl,
    // 운영 DB에서 Entity 변경만으로 테이블이 자동 변경되지 않도록 항상 false로 둡니다.
    synchronize: false,
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
  };
}

// Nest 앱이 실행될 때 TypeOrmModule.forRootAsync에서 사용하는 설정입니다.
export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize TypeORM.');
  }

  return {
    ...createPostgresOptions(databaseUrl),
    // 각 기능 모듈에서 TypeOrmModule.forFeature로 등록한 Entity를 자동으로 로드합니다.
    autoLoadEntities: true,
  };
}

// TypeORM CLI가 migration 생성/실행 시 사용하는 설정입니다.
// CLI는 Nest 모듈을 읽지 않으므로 Entity와 migration 파일 경로를 직접 지정합니다.
export function createMigrationDataSourceOptions(
  databaseUrl: string,
): DataSourceOptions {
  return {
    ...createPostgresOptions(databaseUrl),
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
  };
}
