import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { getClientIp } from "../utils";

@Injectable()
export class IpGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const clientIp = getClientIp(request);
    if (
      controller === "AuthController" &&
      ["signIn", "register"].includes(handler)
    ) {
      return true;
    }

    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Unauthorized");
    }

    const dbUser = await this.usersService.getMe(user.sub);

    if (dbUser.ips && !dbUser.ips.includes(clientIp)) {
      throw new ForbiddenException("Access denied from this IP");
    }

    return true;
  }
}
