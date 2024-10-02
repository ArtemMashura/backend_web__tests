import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { Tokens } from 'src/modules/auth/types/tokens.type';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    public async generateToken(payload: any):Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('AT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('RT_SECRET'),
                expiresIn: '7d',
            }),
        ])
        return {
            accessToken: at,
            refreshToken: rt,
        };
        // this.jwtService.signAsync(payload,
        //     {
        //         secret: this.configService.get<string>('SECRET'),
        //         expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        //         algorithm: 'HS256',
        //         jwtid: v4(),
        //     });
    }

    public async refreshAccessToken(payload: any):Promise<string> {
        const[at] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('AT_SECRET'),
                expiresIn: '15m',
            }),
            
        ])
        return at
        
        // this.jwtService.signAsync(payload,
        //     {
        //         secret: this.configService.get<string>('SECRET'),
        //         expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        //         algorithm: 'HS256',
        //         jwtid: v4(),
        //     });
    }

    /**
     * Verify and return payload if token is valid
     * @param token  -  Token that will be verified
     * @param type   -  Access ot Refresh token
     */
    public verifyToken(token: string, type: 'access' | 'refresh') {
        if (type === 'access') {
            try {
                return this.jwtService.verify(token, {
                    secret: this.configService.get<string>('AT_SECRET'),
                    ignoreExpiration: false,
                    algorithms: ['HS256'],
                });
            } catch (e) {
                throw new UnauthorizedException();
            }
        }
        else if (type === 'refresh') {
            try {
                return this.jwtService.verify(token, {
                    secret: this.configService.get<string>('RT_SECRET'),
                    ignoreExpiration: false,
                    algorithms: ['HS256'],
                });
            } catch (e) {
                throw new UnauthorizedException();
            }
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
