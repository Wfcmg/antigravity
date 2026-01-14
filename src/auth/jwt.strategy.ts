import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'dev_secret_change_me',
        });
    }

    async validate(payload: { sub: number; email: string }) {
        const user = await this.userService.findById(payload.sub);
        if (!user) throw new UnauthorizedException('Token válido pero usuario no existe');

        return { id: user.id, email: user.email, nombre: user.nombre };
    }
}
