import { User } from "./user.entity";
import { EntityManager, Like } from "typeorm";
import { AppDataSource } from "../../config/database.config";

export class UserRepositry {
  private get repo() {
    return AppDataSource.getRepository(User);
  }
  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(User) : this.repo;
  }

  //finding a user with id
  async findById(id: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({
        where: {id},
        });
  }

  //find a user by email
  //we used query builder because we have exclude the passwordHash field in the
  // result so we have to manually select it here
  async findByEmail(email: string, manager?: EntityManager) {
    return this.getRepo(manager)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  // Create or update a user
  // No id in data = INSERT, id in data = UPDATE
  async save(data: Partial<User>, manager?: EntityManager) {
    return this.getRepo(manager).save(data as User);
  }

  // Soft delete — sets deletedAt, user disappears from normal queries
  async softDelete(id: string, manager?: EntityManager) {
    await this.getRepo(manager).softDelete(id);
  }

  async listForAdmin(
    search: string,
    take: number,
    skip: number
  ) {
    const repository = this.getRepo();
    const where = search
      ? { email: Like(`%${search}%`) }
      : {};
    const [items, total] = await repository.findAndCount({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        isAccountVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: "DESC" },
      take,
      skip,
    });
    return [items, total] as const;
  }
}

// One shared instance for the whole app
export const UserRepository = new UserRepositry();
