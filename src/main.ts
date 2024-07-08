import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: { credentials: true, origin: true },
    });
    const config = app.get<ConfigService>(ConfigService);

    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    await app.listen(config.get("PORT"), () => console.log(`Host on http://localhost:${config.get("PORT")}`));
}
bootstrap();
