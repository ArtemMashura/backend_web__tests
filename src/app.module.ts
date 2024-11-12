import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { UserModule } from './modules/user/user.module';
import { DirectMessageModule } from './modules/direct-message/direct-message.module';
import { OpenAIChatModule } from './modules/openAIchat/openAIchat.module';
import { DaleeImageGenerationModule } from './modules/dalee-image-generation/dalee-image-generation.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                PORT: Joi.number().required().default(5000),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().required().default(5432),
                DB_USERNAME: Joi.string().required().default('postgres'),
                DB_PASSWORD: Joi.string().required(),
                DB_DATABASE_NAME: Joi.string().required().default('postgres'),
            }),
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
        UserModule,
        AuthModule,
        ChatModule,
        DirectMessageModule,
        OpenAIChatModule,
        DaleeImageGenerationModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
