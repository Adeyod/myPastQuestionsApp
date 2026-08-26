import { Injectable, NotFoundException } from '@nestjs/common';
import { PracticeModeRepository } from '../repositories/practice-mode.repository';

@Injectable()
export class PracticeModeService {
  constructor(private readonly practiceModeRepo: PracticeModeRepository) {}
  async getAllPracticeModes() {
    const response = await this.practiceModeRepo.findAllPracticeModes();

    return response;
  }

  async getPracticeModeByName(mode: string) {
    const response = await this.practiceModeRepo.findByName(mode);

    if (!response) {
      throw new NotFoundException({
        message: 'Practice mode not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
}
