import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mw as requestIpMw } from 'request-ip';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { HttpExceptionsFilter } from 'src/common/filters/http-exceptions-filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path, { join } from 'path';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // 开启跨域访问
  });
  const config = app.get(ConfigService);
  // 设置访问频率
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
    }),
  );
  // 设置 api 访问前缀
  const prefix = config.get<string>('app.prefix');

  const rootPath = process.cwd();
  const baseDirPath = path.posix.join(rootPath, config.get('app.file.location'));
  app.useStaticAssets(baseDirPath, {
    prefix: '/profile/',
    maxAge: 86400000 * 365,
  });

  app.useStaticAssets('public', {
    prefix: '/public/',
    maxAge: 0,
  });

  //配置模板引擎
  app.useStaticAssets(join(__dirname, '..', 'views'), {
    prefix: '/views/',
  });
  app.setBaseViewsDir('views');
  app.setViewEngine('ejs');

  app.setGlobalPrefix(prefix);
  // 全局验证
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false, // 放开 CSP 限制
    }),
  );
  const swaggerOptions = new DocumentBuilder()
    .setTitle('Nest-Admin')
    .setDescription('Nest-Admin 接口文档')
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header', // 认证信息放置的位置
        name: 'Authorization', // 显式指定请求头名称
        description: '请在请求头中携带 JWT 令牌，格式：Bearer <token>',
      },
      'Authorization',
    )
    .addServer(config.get<string>('app.file.domain'))
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  // 保存OpenAPI规范文件
  writeFileSync(path.posix.join(process.cwd(), 'public', 'openApi.json'), JSON.stringify(document, null, 2));

  // 项目依赖当前文档功能，最好不要改变当前地址
  // 生产环境使用 nginx 可以将当前文档地址 屏蔽外部访问
  SwaggerModule.setup(`${prefix}/swagger-ui`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Nest-Admin API Docs',
  });

  // 获取真实 ip
  app.use(requestIpMw({ attributeName: 'ip' }));
  //服务端口
  const port = config.get<number>('app.port') || 3000;
  await app.listen(port);
  console.log('                            _ooOoo_');
  console.log('                           o8888888o');
  console.log('                           88" . "88');
  console.log('                           (| -_- |)');
  console.log('                           O\\  =  /O');
  console.log("                        ____/`---'\\____");
  console.log("                      .'  \\||     ||/  `.");
  console.log('                     /  \\||||  :  ||||/  \\ ');
  console.log('                    /  _||||| -:- |||||-  \\ ');
  console.log('                    |   | |||  -  ||| |   |');
  console.log("                    | \\_|  ''\\---/''  |   |");
  console.log('                    \\  .-\\__  `-`  ___/-. /');
  console.log("                  ___`. .'  /--.--\\  `. . __");
  console.log("               .'''< ```.___\\_<|>_/___. ```>'''.");
  console.log('              | | :  `- \\`.;`\\ _ /`;.`/ - ` : | |');
  console.log('              \\  \\ `-.   \\_ __\\ /__ _/   .-` /  /');
  console.log("         ======`-.____`-.___\\_____/___.-`____.-'======");
  console.log('         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log('                // 佛祖保佑 永不宕机 永无BUG //');
  console.log('               //  程序启动...Nest-Admin 服务启动成功' + '//');
  console.log('🚀服务地址', `http://localhost:${port}${prefix}/`);
  console.log('🚀模板引擎启动成功：', `http://localhost:${port}${prefix}/html/`);
  console.log('🚀swagger 文档地址', `http://localhost:${port}${prefix}/swagger-ui/`);
}
bootstrap();
