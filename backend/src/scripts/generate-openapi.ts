import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';

async function generateOpenApiJson() {
  const app = await NestFactory.create(AppModule);

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
  
  // 生成 OpenAPI JSON 文件
  const outputPath = join(__dirname, '..', '..', 'public', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`✅ OpenAPI JSON 已生成至: ${outputPath}`);
  console.log(`📄 文件大小: ${Buffer.byteLength(JSON.stringify(document))} bytes`);
  console.log(`🚀 共 ${Object.keys(document.paths || {}).length} 個 API 路徑`);
  
  await app.close();
}

generateOpenApiJson().catch((error) => {
  console.error('生成 OpenAPI JSON 時發生錯誤:', error);
  process.exit(1);
}); 