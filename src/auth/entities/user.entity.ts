import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('auth_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookId: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
