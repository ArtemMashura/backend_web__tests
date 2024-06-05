import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: { credentials: true, origin: 'http://localhost:3000' },
    });

    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    await app.listen(5000, () => console.log('Host on http://localhost:5000'));
}
bootstrap();
