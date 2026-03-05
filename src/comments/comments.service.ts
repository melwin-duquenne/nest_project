import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Comment[]> {
    return this.commentsRepository.find({ relations: ['author', 'task'] });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'task'],
    });
    if (!comment) throw new NotFoundException(`Comment #${id} not found`);
    return comment;
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    const task = await this.tasksService.findOne(dto.taskId);
    const author = await this.usersService.findOne(dto.authorId);
    const comment = this.commentsRepository.create({
      content: dto.content,
      task,
      author,
    });
    return this.commentsRepository.save(comment);
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    if (dto.content !== undefined) {
      comment.content = dto.content;
    }
    return this.commentsRepository.save(comment);
  }

  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentsRepository.remove(comment);
  }
}
