import { Column, Entity } from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';

@Entity()
export class Guest extends BaseTable {
  @Column({ length: 30 })
  nickname: string;

  @Column({ length: 6, unique: true })
  displayCode: string;
}
