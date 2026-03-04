/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
    GetObjectCommand,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    @Inject('S3_CLIENT') private s3Client: S3Client,
    private configService: ConfigService,
  ) {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION');

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }
    if (!region) {
      throw new Error('AWS_REGION is not configured');
    }

    this.bucketName = bucketName;
    this.region = region;
  }

  async uploadOfferFile(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'tutorias-imagenes');
  }

  async uploadProfileFile(file: Express.Multer.File): Promise<string> {
    return this.uploadFile(file, 'tutor-perfiles');
  }

  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    if (!file) throw new Error('File not provided');

    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    try {
      const putObjectParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(putObjectParams);
      await this.s3Client.send(command);

      this.logger.log(
        `File ${uniqueFileName} uploaded to ${folder} successfully`,
      );

      return this.getPublicUrl(key);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error uploading file: ${errMsg}`);
      throw new Error('Failed to upload file to AWS S3');
    }
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  public async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating presigned URL: ${errMsg}`);
      throw new Error('Failed to generate presigned URL');
    }
  }
}
