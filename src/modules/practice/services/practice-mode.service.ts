import { Injectable } from '@nestjs/common';
import { PracticeModeRepository } from '../repositories/practice-mode.repository';

@Injectable()
export class PracticeModeService {
  constructor(private readonly practiceModeRepo: PracticeModeRepository) {}
  async getAllPracticeModes() {
    const response = await this.practiceModeRepo.findAllPracticeModes();

    return response;
  }
}
