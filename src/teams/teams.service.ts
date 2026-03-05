import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ relations: ['members'] });
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'projects'],
    });
    if (!team) throw new NotFoundException(`Team #${id} not found`);
    return team;
  }

  async create(dto: CreateTeamDto): Promise<Team> {
    const team = this.teamsRepository.create(dto);
    return this.teamsRepository.save(team);
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findOne(id);
    Object.assign(team, dto);
    return this.teamsRepository.save(team);
  }

  async remove(id: string): Promise<void> {
    const team = await this.findOne(id);
    await this.teamsRepository.remove(team);
  }

  async addMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.findOne(teamId);
    const user = await this.usersService.findOne(userId);
    const alreadyMember = team.members.some((m) => m.id === userId);
    if (alreadyMember) {
      throw new ConflictException(`User #${userId} is already a member of team #${teamId}`);
    }
    team.members.push(user);
    return this.teamsRepository.save(team);
  }

  async removeMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.findOne(teamId);
    team.members = team.members.filter((m) => m.id !== userId);
    return this.teamsRepository.save(team);
  }
}
