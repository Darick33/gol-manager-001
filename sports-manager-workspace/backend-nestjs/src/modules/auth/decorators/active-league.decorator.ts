import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveLeague = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeLeagueId ?? request.user?.leagueId ?? null;
  },
);
