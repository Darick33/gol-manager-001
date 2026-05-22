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
  async upload(
    @Req() req: FastifyRequest,
    @Query('folder') folder: string = 'general',
  ) {
    const data = await req.file();

    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const buffer = await data.toBuffer();
    const url = await this.cloudinaryService.uploadImage(buffer, folder);

    return { url };
  }
}
