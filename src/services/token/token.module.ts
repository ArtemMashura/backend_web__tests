import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: async () => ({
                verifyOptions: {
                    ignoreExpiration: false,
                    algorithms: ['HS256'],
                },
                signOptions: { algorithm: 'HS256' },
            }),
        }),
    ],
    providers: [TokenService],
    exports: [TokenService],
})
export class TokenModule {}
