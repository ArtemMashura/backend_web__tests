import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class FilesUploadS3Service {
    private s3Client: AWS.S3;

    constructor(private readonly configService: ConfigService) {
        this.s3Client = new AWS.S3({
            endpoint: this.configService.get<string>('AWS_HOST'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
                secretAccessKey: this.configService.get<string>(
                    'AWS_SECRET_ACCESS_KEY'
                ),
            },
        });
    }

    async uploadProfilePhoto(filename: string, file: Buffer) {
        return (
            await this.s3Client
                .upload({
                    Bucket: this.configService.get<string>(
                        'AWS_PROFILE_PHOTO_BUCKET'
                    ),
                    Body: file,
                    Key: filename,
                })
                .promise()
        ).Location;
    }
}
