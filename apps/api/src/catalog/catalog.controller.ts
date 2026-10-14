import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { parseMaturity, parsePositiveInt } from '../common/query.js';
import { CatalogService } from './catalog.service.js';

const PAGES = new Set(['home', 'movies', 'tv', 'free', 'kids']);

/** Public, viewer-independent catalog reads, safe to cache at the edge. */
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('pages/:page')
  @Header('Cache-Control', 'public, max-age=60')
  page(@Param('page') page: string, @Query('maxMaturity') maxMaturity?: string) {
    return this.catalog.page(PAGES.has(page) ? page : 'home', parseMaturity(maxMaturity));
  }

  @Get('genres')
  @Header('Cache-Control', 'public, max-age=300')
  genres(@Query('maxMaturity') maxMaturity?: string) {
    return this.catalog.genres(parseMaturity(maxMaturity));
  }

  @Get('genres/:slug')
  @Header('Cache-Control', 'public, max-age=60')
  genre(
    @Param('slug') slug: string,
    @Query('maxMaturity') maxMaturity?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.catalog.genre(slug, parseMaturity(maxMaturity), parsePositiveInt(page, 1, 1000), parsePositiveInt(pageSize, 24, 60));
  }

  @Get('titles/:slug')
  @Header('Cache-Control', 'public, max-age=60')
  title(@Param('slug') slug: string) {
    return this.catalog.title(slug);
  }
}
