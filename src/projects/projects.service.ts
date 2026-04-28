import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly teamsService: TeamsService,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({ relations: ['team', 'tasks'] });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['team', 'tasks'],
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const team = await this.teamsService.findOne(dto.teamId);
    const project = this.projectsRepository.create({
      name: dto.name,
      description: dto.description,
      status: dto.status,
      team,
    });
    return this.projectsRepository.save(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    if (dto.teamId) {
      project.team = await this.teamsService.findOne(dto.teamId);
    }
    // Exclut teamId du reste car déjà traité comme relation ci-dessus
    const { teamId: _teamId, ...rest } = dto;
    Object.assign(project, rest);
    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.remove(project);
  }
}
