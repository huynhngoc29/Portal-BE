import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { Tool } from './entities/tool.entity';
import { AdminToolGuard } from './guards/admin-tool.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tool]), AuthModule],
  controllers: [ToolsController],
  providers: [ToolsService, AdminToolGuard],
})
export class ToolsModule {}
