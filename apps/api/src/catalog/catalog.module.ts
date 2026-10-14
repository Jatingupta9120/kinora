import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '../schemas/collection.schema.js';
import { Title, TitleSchema } from '../schemas/title.schema.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Title.name, schema: TitleSchema },
      { name: Collection.name, schema: CollectionSchema },
    ]),
  ],
  controllers: [CatalogController, SearchController],
  providers: [CatalogService, SearchService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
