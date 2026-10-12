import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    length: 100,
    name: 'display_name',
    nullable: true,
  })
  displayName: string | null;

  @Column('varchar', {
    unique: true,
    length: 320,
  })
  email: string;

  @Column('varchar', {
    nullable: true,
    select: false,
    name: 'password_hash',
  })
  passwordHash: string | null;

  @Column('timestamptz', {
    nullable: true,
    name: 'email_verified_at',
  })
  emailVerifiedAt: Date | null;

  @Column('varchar', {
    length: 64,
  })
  timezone: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt: Date;
}
