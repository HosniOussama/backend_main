import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const configService = new ConfigService();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.setGlobalPrefix('/api', {
    exclude: [
      { path: 'uploads', method: RequestMethod.ALL },
      { path: 'uploads/(.*)', method: RequestMethod.ALL },
    ],
  });

  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(
    `Server running ${process.env.NODE_ENV === 'development' ? 'on port ' + port : 'on production'}`,
  );
}
bootstrap();
