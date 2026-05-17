import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGuestRoomParticipantSchema1777949395348 implements MigrationInterface {
  name = 'CreateGuestRoomParticipantSchema1777949395348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "guest" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "nickname" character varying(30) NOT NULL, "displayCode" character varying(6) NOT NULL, CONSTRAINT "UQ_790392ac6efbc1183a253b4028b" UNIQUE ("displayCode"), CONSTRAINT "PK_57689d19445de01737dbc458857" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."room_status_enum" AS ENUM('WAITING', 'PLAYING', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "title" character varying NOT NULL, "isPublic" boolean NOT NULL DEFAULT true, "status" "public"."room_status_enum" NOT NULL DEFAULT 'WAITING', "hostGuestId" character varying NOT NULL, "hostNickname" character varying NOT NULL, "maxParticipants" integer NOT NULL DEFAULT '4', "passwordHash" character varying, CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "room_participant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "roomId" uuid NOT NULL, "guestId" uuid NOT NULL, "isHost" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_e909ff48663becf88427715514" UNIQUE ("guestId"), CONSTRAINT "PK_f4e1d0fa763659c18b645646130" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_participant" ADD CONSTRAINT "FK_33a082f26c45bd9fd6309dca69e" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_participant" ADD CONSTRAINT "FK_e909ff48663becf88427715514d" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_participant" DROP CONSTRAINT "FK_e909ff48663becf88427715514d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_participant" DROP CONSTRAINT "FK_33a082f26c45bd9fd6309dca69e"`,
    );
    await queryRunner.query(`DROP TABLE "room_participant"`);
    await queryRunner.query(`DROP TABLE "room"`);
    await queryRunner.query(`DROP TYPE "public"."room_status_enum"`);
    await queryRunner.query(`DROP TABLE "guest"`);
  }
}
