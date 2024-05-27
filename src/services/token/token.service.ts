import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    public generateTokens(payload: object) {
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
            algorithm: 'HS256',
            jwtid: v4(),
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
            algorithm: 'HS256',
            jwtid: v4(),
        });

        return { accessToken, refreshToken };
    }

    /**
     * Verify and return payload if token is valid
     * @param token  -  Token that will be verified
     * @param type   -  Access ot Refresh token
     */
    public verifyToken(token: string, type: 'access' | 'refresh') {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get<string>(
                    type === 'access' ? 'ACCESS_SECRET' : 'REFRESH_SECRET'
                ),
                ignoreExpiration: false,
                algorithms: ['HS256'],
            });
        } catch (e) {
            throw new UnauthorizedException();
        }
    }

    public generateTokenEmail(payload: object) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
            algorithm: 'HS256',
        });
    }
}
