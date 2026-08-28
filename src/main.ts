import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());

  const config = app.get(ConfigService<AppConfig, true>);
  const frontendUrl = config.get('FRONTEND_URL', { infer: true });
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Flaship Courier API')
    .setDescription(
      'Backend API for flaship.pk. Responses are wrapped as `{ success, data, error }`.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Listening on http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
