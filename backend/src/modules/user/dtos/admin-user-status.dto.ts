import { IsEnum, IsNotEmpty } from "class-validator";
import { USERSTATUS } from "../../../shared/enums";

export class AdminUserStatusDto {
  @IsEnum(USERSTATUS)
  @IsNotEmpty()
  status!: USERSTATUS;
}
