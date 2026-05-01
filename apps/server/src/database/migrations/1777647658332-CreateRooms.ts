import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRooms1777647658332 implements MigrationInterface {
  name = 'CreateRooms1777647658332';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."room_participants_role_enum" AS ENUM('host', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "room_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "client_id" character varying(80) NOT NULL, "nickname" character varying(30) NOT NULL, "role" "public"."room_participants_role_enum" NOT NULL DEFAULT 'member', "score" integer NOT NULL DEFAULT '0', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "left_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_58f6bdfdb92476fdd5525655431" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rooms_type_enum" AS ENUM('direct', 'group', 'catchmind')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'playing', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(80) NOT NULL, "type" "public"."rooms_type_enum" NOT NULL DEFAULT 'group', "status" "public"."rooms_status_enum" NOT NULL DEFAULT 'waiting', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_participants" ADD CONSTRAINT "FK_25cf9baa7efbb4d9a924c396b17" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_participants" DROP CONSTRAINT "FK_25cf9baa7efbb4d9a924c396b17"`,
    );
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TYPE "public"."rooms_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."rooms_type_enum"`);
    await queryRunner.query(`DROP TABLE "room_participants"`);
    await queryRunner.query(`DROP TYPE "public"."room_participants_role_enum"`);
  }
}
