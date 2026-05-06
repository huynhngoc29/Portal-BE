import { ConflictException, Injectable } from '@nestjs/common';
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
    await this.ensureUniqueNameAndUrl(createToolDto);

    const tool = this.toolsRepository.create(createToolDto);
    return await this.toolsRepository.save(tool);
  }

  async createByAdmin(
    createToolDto: CreateToolDto,
    adminId?: number,
  ): Promise<Tool> {
    await this.ensureUniqueNameAndUrl(createToolDto);

    const tool = this.toolsRepository.create({
      ...createToolDto,
      created_by: adminId,
    });

    return await this.toolsRepository.save(tool);
  }

  async findAll(): Promise<Tool[]> {
    return await this.toolsRepository.find({ where: { is_active: true } });
  }

  async findOne(id: number): Promise<Tool | null> {
    return (await this.toolsRepository.findOne({ where: { id } })) || null;
  }

  async update(id: number, updateToolDto: UpdateToolDto): Promise<Tool | null> {
    await this.toolsRepository.update(id, updateToolDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.toolsRepository.delete(id);
  }

  private async ensureUniqueNameAndUrl(
    createToolDto: CreateToolDto,
  ): Promise<void> {
    const duplicateByName = await this.toolsRepository.findOne({
      where: { name: createToolDto.name },
    });

    if (duplicateByName) {
      throw new ConflictException('Tool name already exists');
    }

    const duplicateByUrl = await this.toolsRepository.findOne({
      where: { url: createToolDto.url },
    });

    if (duplicateByUrl) {
      throw new ConflictException('Tool URL already exists');
    }
  }
}
