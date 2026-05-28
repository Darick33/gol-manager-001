import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  uploadImage(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `gol-manager/${folder}`, resource_type: 'image' },
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async removeBackground(buffer: Buffer): Promise<Buffer> {
    const { removeBackground } = await import('@imgly/background-removal-node');
    const inputBlob = new Blob([new Uint8Array(buffer)], { type: this.detectMime(buffer) });
    const resultBlob = await removeBackground(inputBlob, {
      model: 'small',
      output: { format: 'image/png', quality: 1 },
    });
    return Buffer.from(await resultBlob.arrayBuffer());
  }

  private detectMime(buf: Buffer): string {
    if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
    if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45) return 'image/webp';
    return 'image/jpeg';
  }
}
