import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
  ) {}

  async create(createToolDto: CreateToolDto): Promise<Tool> {
    const tool = this.toolsRepository.create(createToolDto);
    return await this.toolsRepository.save(tool);
  }

  async findAll(): Promise<Tool[]> {
    return await this.toolsRepository.find({ where: { is_active: true } });
  }

  async findOne(id: number): Promise<Tool> {
    return await this.toolsRepository.findOne({ where: { id } });
  }

  async update(id: number, updateToolDto: UpdateToolDto): Promise<Tool> {
    await this.toolsRepository.update(id, updateToolDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.toolsRepository.delete(id);
  }
}
