import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import 'module-alias/register';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptor/global-response.interceptor';
import { UsersRepository } from './modules/users/repositories/users.repository';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;
  app.setGlobalPrefix('/api/v1');

  console.log('port:', port);

  const questionsQueue = app.get<Queue>(getQueueToken('questions-sync'));
  const mailQueue = app.get<Queue>(getQueueToken('mail'));

  // Bull Board Express adapter
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const repo = app.get(UsersRepository);
  // await repo.setExistingUsersInactive();
  // await repo.findByEmail('ayodejiadebolu@gmail.com');

  // Create Bull Board
  const { addQueue, removeQueue, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(mailQueue), new BullAdapter(questionsQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // Configure pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // This removes any property not defined in dto
      forbidNonWhitelisted: false,
      transform: true, // transform plain obj to dto classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || []).map(
    (origin) => origin.trim(),
  );

  // app.enableCors({
  //   origin: (
  //     origin: string | undefined,
  //     callback: (err: Error | null, allow?: boolean) => void,
  //   ) => {
  //     if (!origin) return callback(null, true);

  //     if (allowedOrigins.includes(origin)) {
  //       return callback(null, true);
  //     }

  //     return callback(new Error('Not allowed by CORS'), false);
  //   },
  //   credentials: true,
  // });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalInterceptors(new GlobalResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new MongoExceptionFilter());

  const serverUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://qanda-backend-1bj1.onrender.com'
      : `http://localhost:${port}`;

  // Enable Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('Q and A API Documentation')
    .setDescription('API documentation for questions and answers application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication related endpoints.')
    .addTag('users', 'User management endpoints')
    .addTag('subjects', 'Subject management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter refresh JWT token',
        in: 'header',
      },
      'JWT-refresh',
    )
    .addServer(serverUrl)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customfavIcon: 'httpd://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar {display: none},
      .swagger-ui .info {margin: 50px, 0, }
      .swagger-ui .info .title {color: #fc0606}
      `,
  });

  app.getHttpAdapter().get('api/docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
    console.log(
      `Bull Board available at http://localhost:${port}/admin/queues`,
    );
  });
}
bootstrap().catch((error) => {
  Logger.error('Error starting server:', error);
  process.exit(1);
});
