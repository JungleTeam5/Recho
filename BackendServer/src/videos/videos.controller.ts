// src/videos/videos.controller.ts

import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('thumbnails')
  async getThumbnails(@Query('userId') userId: string) {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.videosService.getThumbnailsByUser(userId);
  }

  @Get('videos')
  async getVideos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: 'likes' | 'createdAt' = 'createdAt',
  ) {
    return this.videosService.getVideos(page, limit, sortBy);
  }

  @Get('source')
  async getSourceVideoUrl(@Query('videoKey') videoKey: string) {
    if (!videoKey) {
      throw new NotFoundException('Video key is required');
    }
    return this.videosService.getSourceVideoUrl(videoKey);
  }
}