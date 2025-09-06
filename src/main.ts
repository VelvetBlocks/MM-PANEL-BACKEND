import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // todo: enable cors with multiple origin through env
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    exposedHeaders: ['Session-Token'],
  });
  app.enableShutdownHooks();
  // app.set('trust proxy', environments.proxyEnabled);
  app.setGlobalPrefix('api');

  setupSwagger(app);

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true, // 👈 allows enum & primitive conversion
      },
    }),
  );

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');

  await app.listen(port, () => {
    console.log(`APPLICATION RUNNING AT : ${port}`);
  });
}

bootstrap();
