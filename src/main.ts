import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { EnvironmentVariables } from './config/env.validation.js';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService<EnvironmentVariables, true> = app.get(ConfigService);
  await app.listen(configService.get('PORT', { infer: true }));
}
await bootstrap();
