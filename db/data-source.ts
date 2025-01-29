// import {
//     TypeOrmModuleAsyncOptions,
//     TypeOrmModuleOptions,
// } from '@nestjs/typeorm';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { join } from 'path';
// import { DataSourceOptions } from 'typeorm';
// import 'dotenv/config'

// export const dataSourceOptions: DataSourceOptions = {
//     type: 'postgres',
//     host: process.env.DB_HOST || "localhost",
//     port: parseInt(process.env.DB_PORT) || 5432,
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE_NAME,
//     entities: [__dirname + '/../**/*.entity.{js.ts}'], // entities: [join(__dirname, '**', '*.entity.{ts,js}')],  
//     migrations: ['dist/db/migrations/*js'],
//     logging: true,
//     ssl: {
//         rejectUnauthorized: true,
//         ca: ca: process.env.DB_SSL,
//     }
// };
