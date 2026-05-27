import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Pool } from 'pg'

export const DATABASE_POOL = 'DATABASE_POOL'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL')

        return new Pool({
          connectionString: databaseUrl,
          ssl: {
            rejectUnauthorized: false,
          },
        })
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}