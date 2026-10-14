import { BadRequestException, Controller, Get, Header, Query } from '@nestjs/common';
import { parseMaturity } from '../common/query.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('suggest')
  @Header('Cache-Control', 'public, max-age=60')
  suggest(@Query('q') q = '', @Query('maxMaturity') maxMaturity?: string) {
    return this.search.suggest(q.slice(0, 80), parseMaturity(maxMaturity));
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=30')
  find(
    @Query('q') q = '',
    @Query('maxMaturity') maxMaturity?: string,
    @Query('genre') genre?: string,
    @Query('kind') kind?: string,
  ) {
    if (kind !== undefined && kind !== '' && kind !== 'movie' && kind !== 'series') {
      throw new BadRequestException('kind must be movie or series');
    }
    return this.search.search(q.slice(0, 120), parseMaturity(maxMaturity), genre || undefined, (kind || undefined) as 'movie' | 'series' | undefined);
  }
}
