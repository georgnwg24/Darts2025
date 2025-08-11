import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LegService } from './leg.service';
import { LegResponseDto } from './dtos/leg-response.dto';
import { plainToInstance } from 'class-transformer';
import { RecordThrowDto } from './dtos/record-throw.dto';

@Controller('leg')
export class LegController {
  constructor(
    private legService: LegService,
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LegResponseDto> {
    const leg = await this.legService.findById(id);
    return plainToInstance(LegResponseDto, leg.toObject());
  }

  @Post('/:id')
  async recordThrow(
    @Param('id') id: string,
    @Body() recordThrowDto: RecordThrowDto
  ): Promise<LegResponseDto> {
    const updatedLeg = await this.legService.recordThrow(id, recordThrowDto);
    return plainToInstance(LegResponseDto, updatedLeg.toObject());
  }

  @Post('rollback/:id')
  async rollbackThrow(
    @Param('id') id: string
  ): Promise<LegResponseDto> {
    const rolledbackLeg = await this.legService.rollbackThrow(id);
    return plainToInstance(LegResponseDto, rolledbackLeg.toObject());
  }
}
