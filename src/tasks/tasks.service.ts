import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ relations: ['project', 'assignee', 'comments'] });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'comments'],
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const project = await this.projectsService.findOne(dto.projectId);
    const assignee = dto.assigneeId
      ? await this.usersService.findOne(dto.assigneeId)
      : null;
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      project,
      assignee,
    });
    return this.tasksRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    if (dto.projectId) {
      task.project = await this.projectsService.findOne(dto.projectId);
    }
    if (dto.assigneeId !== undefined) {
      task.assignee = dto.assigneeId
        ? await this.usersService.findOne(dto.assigneeId)
        : null;
    }
    const { projectId: _p, assigneeId: _a, ...rest } = dto;
    Object.assign(task, rest);
    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
