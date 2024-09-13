import {
    TypeOrmModuleAsyncOptions,
    TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config'

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD) as string,
    database: process.env.DB_DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity.{js.ts}'], // entities: [join(__dirname, '**', '*.entity.{ts,js}')],  
    migrations: ['dist/db/migrations/*js'],
    logging: true,
};

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (
        configService: ConfigService
    ): Promise<TypeOrmModuleOptions> => {
        return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE_NAME'),
            entities: [__dirname + '/../**/*.entity.{js.ts}'], // entities: [join(__dirname, '**', '*.entity.{ts,js}')],  
            autoLoadEntities: true,
            migrations: ['dist/db/migrations/*js'],
            logging: true,
            synchronize: true
        };
    },
};

const dataSource = new DataSource(dataSourceOptions)
export default dataSource