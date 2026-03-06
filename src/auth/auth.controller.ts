import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Request()
    req: {
      user: { id: string; email: string; name: string; role: string };
    },
  ) {
    return this.authService.login(req.user);
  }

  @Get('me')
  me(@CurrentUser() user: { id: string; email: string; role: string }) {
    return this.usersService.findOne(user.id);
  }
}
