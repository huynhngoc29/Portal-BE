import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { AdminToolGuard } from './guards/admin-tool.guard';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolsService.create(createToolDto);
  }

  @Post('admin')
  @UseGuards(AdminToolGuard)
  createByAdmin(
    @Body() createToolDto: CreateToolDto,
    @Headers('x-admin-id') adminId?: string,
  ) {
    if (adminId === undefined) {
      return this.toolsService.createByAdmin(createToolDto);
    }

    const parsedAdminId = Number(adminId);
    if (!Number.isInteger(parsedAdminId) || parsedAdminId <= 0) {
      throw new BadRequestException('x-admin-id must be a positive integer');
    }

    return this.toolsService.createByAdmin(createToolDto, parsedAdminId);
  }

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToolDto: UpdateToolDto,
  ) {
    return this.toolsService.update(id, updateToolDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.remove(id);
  }
}
