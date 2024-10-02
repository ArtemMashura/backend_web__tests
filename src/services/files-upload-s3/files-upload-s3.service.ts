import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class FilesUploadS3Service {
    private readonly s3Client: AWS.S3;

    constructor(private readonly configService: ConfigService) {
        this.s3Client = new AWS.S3({
            endpoint: this.configService.get<string>('AWS_HOST'),
            region: this.configService.getOrThrow('AWS_S3_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
                secretAccessKey: this.configService.get<string>(
                    'AWS_SECRET_ACCESS_KEY'
                ),
            },
            
        });
    }

    async uploadProfilePhoto(filename: string, file: Buffer, mimetype: string) {
        return (
            await this.s3Client
                .upload({
                    Bucket: this.configService.get<string>(
                        'AWS_PROFILE_PHOTO_BUCKET'
                    ),
                    Body: file,
                    Key: filename,
                    ContentType: mimetype
                })
                .promise()
        ).Location;
    }

    async uploadFile(filename: string, file: Buffer, mimetype:string) {
        try {
            return ( 
                await this.s3Client
                    .upload({
                        Bucket: this.configService.get<string>(
                            'AWS_FILE_BUCKET'
                        ),
                        Body: file,
                        Key: filename,
                        ContentType: mimetype
                    })
                    .promise()
            ).Location;
        } catch (error) {
            console.log(error)
        }
        
    }










    

    // constructor(private readonly configService: ConfigService) {}

    // private readonly s3Client = new S3Client({
    //     region: this.configService.getOrThrow('AWS_S3_REGION'),
    //     endpoint: this.configService.get<string>('AWS_HOST'),
    //         credentials: {
    //             accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
    //             secretAccessKey: this.configService.get<string>(
    //                 'AWS_SECRET_ACCESS_KEY'
    //             ),
    //         },
    // })

    // const x = new AWS.Upload({
    //     client: S3Client,
    //     queueSize: 4,
    //     leavePartsOnError: false,
    //     params: {
    //       ACL: "public-read",
    //       Key: ,
    //       Body: file,
    //       Bucket: AWS_S3_BUCKET_NAME,
    //     },
    // })

    // async uploadProfilePhoto(filename: string, file: Buffer) {
    //     return (
    //         await this.s3Client.send(
    //             new PutObjectCommand({
    //                 Bucket: this.configService.get<string>('AWS_PROFILE_PHOTO_BUCKET'),
    //                 Body: file,
    //                 Key: filename,
    //             })
    //         )
    //     )
    // }

    // async uploadFile(filename: string, file: Buffer) {
    //     return (
    //         await this.s3Client.send(
    //             new PutObjectCommand({
    //                 Bucket: this.configService.get<string>('AWS_FILE_BUCKET'),
    //                 Body: file,
    //                 Key: filename,
    //             })
    //         ).promise()
    //     )
    // }
}
