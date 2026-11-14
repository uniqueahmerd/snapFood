import { EntityManager } from 'typeorm'

import { Token } from './token.entity'
import { AppDataSource } from '../../config/database.config'
import { User } from '../user'
import { TOKENTYPE } from '../../shared/enums'


export class TokenRepositry {

  private get repo() {
    return AppDataSource.getRepository(Token);
  }

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Token) : this.repo;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  async create(
    userId: string,
    token: string,
    type: string,
    expiresAt: Date,
    manager?: EntityManager
  ): Promise<Token> {
    const entity = this.getRepo(manager).create({ 
      userId, 
      token,
      type: type as any, 
      expiresAt 
    });
    return this.getRepo(manager).save(entity)
  }

  async findByToken(
    token: string,
    manager?: EntityManager
  ): Promise<Token | null> {
    return this.getRepo(manager).findOne({ where: { token } });
  }

  async deleteByToken(
    token: string,
    manager?: EntityManager
  ): Promise<void> {
    await this.getRepo(manager).delete({ token });
  }

  async deleteAllByUserId(
    userId:   string,
    manager?: EntityManager
  ): Promise<void> {
    await this.getRepo(manager).delete({ userId });
  }

   async deleteByUserIdAndType(
    userId: string,
    type: TOKENTYPE,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepo(manager).delete({ userId, type })
  }
}

export const tokenRepository = new TokenRepositry()
