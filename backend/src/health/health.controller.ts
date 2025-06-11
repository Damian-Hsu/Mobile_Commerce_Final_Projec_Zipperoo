import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseDto } from '../common/dto/response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('系統健康檢查')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ 
    summary: '健康檢查', 
    description: '檢查系統運行狀態' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '系統運行正常',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '系統健康' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            service: { type: 'string', example: 'Zipperoo Backend' }
          }
        }
      }
    }
  })
  getHealth() {
    return ResponseDto.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Zipperoo Backend',
    }, '系統健康');
  }
} 