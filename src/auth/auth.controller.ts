import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ActiveUser } from "../common/decorators/active-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { Response } from "express";
import { ChangePasswordDto } from "./dto/users-pw-change";
import { User } from "src/users/entities/user.entity";
import { generateStrongPassword } from "src/common/utils";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiConflictResponse({
    description: "User already exists",
  })
  @ApiBadRequestResponse({
    description: "Return errors for invalid sign up fields",
  })
  @ApiCreatedResponse({
    description: "User has been successfully signed up",
  })
  @Public()
  @Post("sign-up")
  signUp(@Body() signUpDto: SignUpDto): Promise<User> {
    return this.authService.signUp(signUpDto);
  }

  @ApiOkResponse({ description: "User has been successfully signed in" })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post("sign-in")
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ success: boolean }> {
    const { accessToken } = await this.authService.signIn(signInDto);

    // set token in response header
    res.setHeader("session-token", accessToken);

    return { success: true };
  }

  @ApiOkResponse({ description: "Password has been successfully changed" })
  @ApiUnauthorizedResponse({
    description: "Invalid current password or unauthorized",
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post("users_pw_change")
  async changePassword(
    @ActiveUser("id") userId: string,
    @Body() dto: ChangePasswordDto
  ): Promise<{ success: boolean }> {
    await this.authService.changePassword(userId, dto);
    return { success: true };
  }

  @ApiOkResponse({ description: "Password has been successfully changed" })
  @ApiUnauthorizedResponse({
    description: "Invalid current password or unauthorized",
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post("users_pw_reset")
  async passwordReset(
    @ActiveUser("id") userId: string,
    @Body("id") id: string
  ): Promise<User> {
    const pw = await await generateStrongPassword();
    const user = await this.authService.resetPassword(id, pw);
    return { ...user, pw } as User;
  }

  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiOkResponse({ description: "User has been successfully signed out" })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post("sign-out")
  signOut(@ActiveUser("id") userId: string): Promise<void> {
    return this.authService.signOut(userId);
  }
}
