import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-key',
        CLOUDINARY_API_SECRET: 'test-secret',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('configures cloudinary on init with env values', () => {
    // clearAllMocks runs after compile(), so we trigger onModuleInit manually
    service.onModuleInit();
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
  });

  describe('uploadImage', () => {
    it('returns the secure_url on success', async () => {
      const fakeBuffer = Buffer.from('fake-image');
      const fakeUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v1/gol-manager/team-logos/abc.jpg';

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts, callback) => {
          callback(null, { secure_url: fakeUrl });
          return { end: jest.fn() };
        },
      );

      const result = await service.uploadImage(fakeBuffer, 'team-logos');
      expect(result).toBe(fakeUrl);
    });

    it('throws on cloudinary error', async () => {
      const fakeBuffer = Buffer.from('bad-image');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts, callback) => {
          callback(new Error('Upload failed'), null);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadImage(fakeBuffer, 'team-logos')).rejects.toThrow(
        'Upload failed',
      );
    });
  });
});
