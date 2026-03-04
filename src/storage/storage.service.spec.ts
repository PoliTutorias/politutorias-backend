/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn().mockImplementation(() => ({})),
  GetObjectCommand: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue(
      'https://test-bucket.s3.us-east-1.amazonaws.com/test-key?signed-params',
    ),
}));

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: 'S3_CLIENT',
          useValue: {
            send: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
              if (key === 'AWS_REGION') return 'us-east-1';
              if (key === 'AWS_ACCESS_KEY_ID') return 'test-access-key';
              if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret-key';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadOfferFile', () => {
    it('Dado un archivo válido, cuando se sube a offers, entonces retorna URL pública de S3', async () => {
      const mockFile = {
        originalname: 'test-offer.jpg',
        buffer: Buffer.from('fake image data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadOfferFile(mockFile);

      expect(result).toContain('://');
      expect(result).toContain('tutorias-imagenes');
      expect(result).toContain('test-bucket.s3.us-east-1.amazonaws.com');
      expect(typeof result).toBe('string');
    });
  });

  describe('uploadProfileFile', () => {
    it('Dado un archivo válido, cuando se sube a profiles, entonces retorna URL pública de S3', async () => {
      const mockFile = {
        originalname: 'profile.jpg',
        buffer: Buffer.from('fake profile image'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadProfileFile(mockFile);

      expect(result).toContain('://');
      expect(result).toContain('tutor-perfiles');
      expect(result).toContain('test-bucket.s3.us-east-1.amazonaws.com');
      expect(typeof result).toBe('string');
    });
  });

  describe('generatePresignedUrl', () => {
    it('Dado una key válida, cuando genera URL firmada, entonces retorna URL firmada de S3', async () => {
      const result = await service.generatePresignedUrl('test-key.jpg');

      expect(typeof result).toBe('string');
      expect(result).toContain('://');
    });
  });
});
