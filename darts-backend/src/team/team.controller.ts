import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { TeamResponseDto } from './dtos/team-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService
  ) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    const createdTeam = await this.teamService.create(createTeamDto);
    return plainToInstance(TeamResponseDto, createdTeam);
  }

  @Get()
  async findAll(): Promise<TeamResponseDto[]> {
    const teams = await this.teamService.findAll();
    return plainToInstance(TeamResponseDto, teams);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TeamResponseDto> {
    const team = await this.teamService.findById(id);
    return plainToInstance(TeamResponseDto, team);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto
  ): Promise<TeamResponseDto> {
    const updatedTeam = await this.teamService.update(id, updateTeamDto);
    return plainToInstance(TeamResponseDto, updatedTeam);
  }

  @Delete(':id')
  async deleteById(@Param('id') id: string): Promise<TeamResponseDto> {
    const removedTeam = await this.teamService.deleteById(id);
    return plainToInstance(TeamResponseDto, removedTeam);
  }
}