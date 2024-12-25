import { Module } from '@nestjs/common';
import { FilesUploadS3Module } from 'src/services/files-upload-s3/files-upload-s3.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
    imports: [
        FilesUploadS3Module,
        UserModule,
        TokenModule, 
        TypeOrmModule.forFeature([UserEntity]),
        EventEmitterModule.forRoot({
            maxListeners: 10
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
