import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): {
    message: string;
    version: string;
  } {
    return {
      message: 'TaskFlow API',
      version: '1.0.0',
    };
  }
}
