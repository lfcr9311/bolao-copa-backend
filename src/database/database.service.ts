import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool, QueryResult, QueryResultRow } from 'pg'
import { DATABASE_POOL } from './database.module'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params)
  }

  async onModuleDestroy() {
    await this.pool.end()
  }
}
