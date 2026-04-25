import bcrypt from 'bcrypt';
import { BadRequestError, UnauthorizedError } from '../core/error.response';
import PlayerModel from '../models/Player.model';
import KeyTokenService from '../services/keyToken.service';
import { getInfoData, generateAuthTokens } from '../utils';
import { findByEmail } from './player.service';
import type { Response } from 'express';

class AccessService {
    static async logout({ keyStore }: { keyStore: { _id: unknown } }) {
        console.log('keyStore', keyStore);
        return await KeyTokenService.removeKeyById(keyStore._id as string);
    }

    static async login(req: { email: string; password: string; refreshToken?: string | null }) {
        const { email, password } = req;
        const player = await findByEmail({ email });
        if (!player) throw new BadRequestError({ message: 'User not found' });

        const isMatching = await bcrypt.compare(password, player.password);
        if (!isMatching) throw new UnauthorizedError({ message: 'Authentication error' });

        const { tokenPair, privateKey, publicKey } = await generateAuthTokens({ user: player as Record<string, unknown>, email });
        const keyStore = await KeyTokenService.createKeyToken({
            userId: (player as any)._id,
            publicKey,
            privateKey,
            refreshToken: tokenPair.refreshToken,
        });

        if (!keyStore) throw new BadRequestError({ message: 'Failed to store keys' });

        return {
            user: getInfoData({ fields: ['_id', 'name', 'email'], object: player as Record<string, unknown> }),
            tokens: tokenPair,
        };
    }

    static setCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
        const isDev = process.env.NODE_ENV !== 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: !isDev,
            sameSite: 'strict' as const,
            path: '/',
        };

        res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }

    static async signUp(req: { name: string; email: string; password: string }) {
        const { name, email, password } = req;
        const existing = await PlayerModel.findOne({ email }).lean();
        if (existing) throw new BadRequestError({ message: 'player already existing!' });

        const passwordHash = await bcrypt.hash(password, 10);
        const newPlayer = await PlayerModel.create({ name, email, password: passwordHash, status: 'active' });
        if (!newPlayer) throw new BadRequestError({ message: 'Failed to create player' });

        const { tokenPair, privateKey, publicKey } = await generateAuthTokens({ user: newPlayer as unknown as Record<string, unknown>, email });
        const keyStore = await KeyTokenService.createKeyToken({
            userId: newPlayer._id,
            publicKey,
            privateKey,
            refreshToken: tokenPair.refreshToken,
        });

        if (!keyStore) throw new BadRequestError({ message: 'Failed to store keys' });

        return {
            user: getInfoData({ fields: ['_id', 'name', 'email'], object: newPlayer as unknown as Record<string, unknown> }),
            tokens: tokenPair,
        };
    }
}

export { AccessService };
