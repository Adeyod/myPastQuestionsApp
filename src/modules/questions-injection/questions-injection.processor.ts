import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { QuestionsInjectionService } from './questions-injection.service';

@Processor('questions-sync')
export class QuestionsProcessor {
  constructor(private readonly syncService: QuestionsInjectionService) {}

  @Process('sync-questions')
  async handleSync(job: Job) {
    console.log('Processing job:', job.id);

    await this.syncService.sync(job);
  }
}
