// Service des tâches — CRUD avec notification WebSocket lors d'une assignation
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Charge toutes les tâches avec leurs relations (projet, assigné, commentaires)
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
    // Vérifie que le projet existe (lève 404 sinon)
    const project = await this.projectsService.findOne(dto.projectId);
    // assigneeId est optionnel — la tâche peut exister sans être assignée
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
    const saved = await this.tasksRepository.save(task);

    if (assignee) {
      this.notificationsGateway.sendToUser(assignee.id, 'task:assigned', {
        taskId: saved.id,
        taskTitle: saved.title,
        message: `Vous avez été assigné à la tâche "${saved.title}"`,
        timestamp: new Date().toISOString(),
      });
    }

    return saved;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    // Mémorise l'assigné précédent pour détecter un changement d'assignation
    const previousAssigneeId = task.assignee?.id;

    if (dto.projectId) {
      task.project = await this.projectsService.findOne(dto.projectId);
    }
    if (dto.assigneeId !== undefined) {
      task.assignee = dto.assigneeId
        ? await this.usersService.findOne(dto.assigneeId)
        : null;
    }

    // Exclut projectId et assigneeId du reste (déjà traités comme relations ci-dessus)
    const { projectId: _projectId, assigneeId: _assigneeId, ...rest } = dto;
    Object.assign(task, rest);
    const updated = await this.tasksRepository.save(task);

    // Envoie une notification temps réel uniquement si l'assigné a changé
    // La notification est envoyée dans la room "user:<id>" via Socket.io
    if (dto.assigneeId && dto.assigneeId !== previousAssigneeId) {
      this.notificationsGateway.sendToUser(dto.assigneeId, 'task:assigned', {
        taskId: updated.id,
        taskTitle: updated.title,
        message: `Vous avez été assigné à la tâche "${updated.title}"`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
