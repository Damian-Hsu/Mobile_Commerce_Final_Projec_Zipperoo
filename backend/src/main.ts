import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  const corsOrigin = configService.get('CORS_ORIGIN', '*');
  const originArray = corsOrigin.split(',').map(item => item.trim());
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || originArray.indexOf(origin) !== -1 || originArray.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global prefix for API routes only
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api-tester.html'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Zipperoo 電商平台 API')
    .setDescription('Zipperoo 電商平台後端 API 文檔')
    .setVersion('1.0')
    .addTag('電商平台')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Zipperoo API 文檔',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // 生成 OpenAPI JSON 文件
  const fs = require('fs');
  const path = require('path');
  const openApiPath = path.join(__dirname, '..', 'public', 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(document, null, 2));

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`📋 API Tester available at: http://localhost:${port}/api-tester.html`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON available at: http://localhost:${port}/openapi.json`);
}

bootstrap(); 