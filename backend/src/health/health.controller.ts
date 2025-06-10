import { Controller, Get } from '@nestjs/common';
import { ResponseDto } from '../common/dto/response.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  getHealth() {
    return ResponseDto.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Zipperoo Backend',
    }, '系統健康');
  }
} 