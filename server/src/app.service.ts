import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NestJS-Admin 服务已启动，请通过前端页面进行访问！！！';
  }
}
