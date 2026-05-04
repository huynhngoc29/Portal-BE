import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { Tool } from './entities/tool.entity';
import { AdminToolGuard } from './guards/admin-tool.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  controllers: [ToolsController],
  providers: [ToolsService, AdminToolGuard],
})
export class ToolsModule {}
