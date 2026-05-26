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
        return new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL')
        })
      }
    }
  ],
  exports: [DATABASE_POOL]
})
export class DatabaseModule {}
