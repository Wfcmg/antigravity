import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const exists = await this.userService.findByEmail(dto.email);
        if (exists) throw new BadRequestException('El email ya está registrado');

        const hash = await bcrypt.hash(dto.password, 10);

        const user = await this.userService.create({
            nombre: dto.nombre,
            email: dto.email,
            password: hash,
        });

        const token = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });

        return {
            message: 'Usuario registrado',
            user: { id: user.id, nombre: user.nombre, email: user.email, createdAt: user.createdAt },
            access_token: token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) throw new UnauthorizedException('Credenciales inválidas');

        const token = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });

        return { message: 'Login correcto', access_token: token };
    }
}
