import { Module } from '@nestjs/common';
import { FilesUploadS3Service } from './files-upload-s3.service';

@Module({
    controllers: [],
    providers: [FilesUploadS3Service],
    exports: [FilesUploadS3Service],
})
export class FilesUploadS3Module {}
