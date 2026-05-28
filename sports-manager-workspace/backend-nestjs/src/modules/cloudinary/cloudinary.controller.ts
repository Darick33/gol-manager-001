import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('upload')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'folder', required: false, example: 'team-logos' })
  @ApiQuery({ name: 'removeBg', required: false, example: 'true' })
  async upload(
    @Req() req: FastifyRequest,
    @Query('folder') folder: string = 'general',
    @Query('removeBg') removeBg?: string,
  ) {
    const data = await req.file();

    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const buffer = await data.toBuffer();

    if (folder === 'player-photos') {
      const processed = await this.cloudinaryService.removeBackground(buffer);
      const url = await this.cloudinaryService.uploadImage(processed, folder);
      return { url };
    }

    if (removeBg === 'true') {
      const [url, bgRemovedBuffer] = await Promise.all([
        this.cloudinaryService.uploadImage(buffer, folder),
        this.cloudinaryService.removeBackground(buffer),
      ]);
      const bgRemovedUrl = await this.cloudinaryService.uploadImage(bgRemovedBuffer, `${folder}-transparent`);
      return { url, bgRemovedUrl };
    }

    const url = await this.cloudinaryService.uploadImage(buffer, folder);
    return { url };
  }
}
