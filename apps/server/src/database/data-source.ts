import { DataSource } from 'typeorm';
import { createMigrationDataSourceOptions } from './typeorm.config';

// Nest 앱 실행용이 아니라 TypeORM CLI가 migration 명령을 실행할 때 읽는 진입점입니다.
// 예: pnpm db:migration:run, pnpm db:migration:generate
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run TypeORM migrations.');
}

// CLI는 Nest의 DI 컨테이너를 거치지 않기 때문에 DataSource 인스턴스를 직접 export합니다.
export default new DataSource(createMigrationDataSourceOptions(databaseUrl));
