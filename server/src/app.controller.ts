import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/html')
  @Render('index')
  root() {
    return {
      title: 'Nest-HTML模板 引擎',
      description: 'Nest-Admin 模板引擎',
    };
  }
}
