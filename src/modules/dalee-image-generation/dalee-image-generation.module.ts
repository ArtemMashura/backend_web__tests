import { Module } from '@nestjs/common';
import { TokenModule } from 'src/services/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FilesUploadS3Module } from 'src/services/files-upload-s3/files-upload-s3.module';
import { DaleeImageGenerationService } from './dalee-image-generation.service';
import { DaleeImageGenerationController } from './dalee-image-generation.controller';
import { UserEntity } from '../user/entities/user.entity';

@Module({
    imports: [
        TokenModule,
    ],
    controllers: [DaleeImageGenerationController],
    providers: [DaleeImageGenerationService],
})
export class DaleeImageGenerationModule {}
