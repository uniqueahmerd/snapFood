import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "food_scan" })
@Index("IDX_food_scan_user_scanned_at", ["userId", "scannedAt"])
export class FoodScan {
	@PrimaryColumn({ type: "uuid" })
	id!: string;

	@Column({ name: "user_id", type: "uuid" })
	userId!: string;

	@Column({ name: "dish_name", type: "varchar", length: 255 })
	dishName!: string;

	@Column({ type: "jsonb" })
	nutrients!: Record<string, unknown>;

	@Column({ type: "integer" })
	calories!: number;

	@Column({ type: "double precision" })
	confidence!: number;

	@Column({ name: "health_assesment", type: "text" })
	healthAssesment!: string;

	@Column({ type: "text" })
	recommendations!: string;

	@Column({ name: "health_condition", type: "varchar", length: 100, nullable: true })
	healthCondition!: string | null;

	@Column({ name: "risk_level", type: "varchar", length: 32 })
	riskLevel!: string;

	@Column({ name: "scanned_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
	scannedAt!: Date;

	@Column({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
	createdAt!: Date;
}
