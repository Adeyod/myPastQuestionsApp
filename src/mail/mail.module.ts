import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'mail',
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
