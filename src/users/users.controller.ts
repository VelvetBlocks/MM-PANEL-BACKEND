import { Body, Controller, Delete, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ActiveUser } from '../common/decorators/active-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto, SignUpDto, UpdateUserDto } from 'src/auth/dto/sign-up.dto';
import { AuthService } from 'src/auth/auth.service';
import { generateStrongPassword } from 'src/common/utils';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'User created successfully', type: User })
  @ApiBearerAuth()
  @Post('create')
  async signUp(@Body() signUpDto: CreateUserDto): Promise<User> {
    const pw = await generateStrongPassword();
    const user = this.authService.signUp({ ...signUpDto, pw });
    return { ...user, pw } as any;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'User created successfully', type: User })
  @ApiBearerAuth()
  @Post('users_upd')
  async updateUser(@Body() signUpDto: UpdateUserDto): Promise<User> {
    return this.authService.updateUser(signUpDto.id, signUpDto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: "Get logged in user's details", type: User })
  @ApiBearerAuth()
  @Post('users_get')
  async getSingle(@Body('id') userId: string): Promise<User> {
    return this.usersService.getMe(userId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: "Get logged in user's details", type: User })
  @ApiBearerAuth()
  @Post('me')
  async getMe(@ActiveUser('id') userId: string): Promise<User> {
    return this.usersService.getMe(userId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @ApiBearerAuth()
  @Post('users_rm')
  async deleteUser(@Body('id') id: string): Promise<{ message: string }> {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'List of users with pagination', type: [User] })
  @ApiBearerAuth()
  @Post()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10): Promise<any> {
    return this.usersService.findAll(Number(page), Number(limit));
  }
}
