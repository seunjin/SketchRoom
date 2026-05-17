import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomParticipantReady1779120000000 implements MigrationInterface {
  name = 'AddRoomParticipantReady1779120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_participant" ADD "isReady" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_participant" DROP COLUMN "isReady"`,
    );
  }
}
