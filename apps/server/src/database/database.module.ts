import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './typeorm.config';

// 앱이 시작될 때 PostgreSQL 연결을 등록하는 DB 인프라 모듈입니다.
// Room, Message 같은 도메인 로직은 이 모듈이 아니라 각 기능 모듈에 둡니다.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // ConfigService를 useFactory에 주입해서 .env 기반 TypeORM 설정을 만듭니다.
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
  ],
})
export class DatabaseModule {}
