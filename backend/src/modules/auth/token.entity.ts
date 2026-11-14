import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";
import { TOKENTYPE } from "../../shared/enums";

@Entity("token")
export class Token {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Index()
  @Column({ type: "text" })
  token!: string;

  @Column({
    type: "enum",
    enum: TOKENTYPE,
  })
  type!: TOKENTYPE;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;

  @Column({ type: "timestamp with time zone" })
  expiresAt!: Date;
}
