import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../shared/entities/base.entity";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Role } from "../../shared/types/types";
import { AUTHPROVIDER, USERSTATUS } from "../../shared/enums";

@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Column({ type: "varchar" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @Column({ type: "varchar", unique: true })
  @IsString()
  @IsEmail()
  email!: string;

  @Column({ type: "varchar", select: false })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password!: string;

  @Column({
    type: "enum",
    enum: AUTHPROVIDER,
    default: AUTHPROVIDER.LOCAL,
  })
  authProvider!: AUTHPROVIDER;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({
    type: "enum",
    enum: USERSTATUS,
    default: USERSTATUS.ACTIVE,
  })
  status!: USERSTATUS;

  @Column({ type: "boolean", default: false })
  isAccountVerified!: boolean;
}
