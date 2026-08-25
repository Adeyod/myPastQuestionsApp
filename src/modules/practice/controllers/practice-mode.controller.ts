import { Controller, Delete, Get, Patch } from '@nestjs/common';
import { PracticeModeService } from '../services/practice-mode.service';

@Controller('practice-modes')
export class PracticeModeController {
  constructor(private readonly practiceModeService: PracticeModeService) {}
  @Get('get-all-practice-modes')
  async getAllPracticeModes() {
    const response = await this.practiceModeService.getAllPracticeModes();

    return response;
  }
  @Get('get-a-practice-mode-by-modeId')
  async getAPracticeModeByModeId() {}
  @Patch('modes/update-practice-mode/:modeId')
  async updatePracticeMode() {}
  @Delete('modes/delete-practice-mode/:modeId')
  async deletePracticeMode() {}
}
