import JWT from 'jsonwebtoken';
import { asyncHandler } from '../helpers/asyncHandler';
import { UnauthorizedError } from '../core/error.response';
import KeyTokenService from '../services/keyToken.service';
import type { Request, Response, NextFunction } from 'express';
import type { Socket } from 'socket.io';

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESH_TOKEN: 'x-refresh-token',
};

const createTokenPair = async (payload: object, publicKey: string, privateKey: string) => {
    try {
        const accessToken = JWT.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '2 days' });
        const refreshToken = JWT.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '7 days' });

        JWT.verify(accessToken, publicKey, (err: Error | null, decode: unknown) => {
            if (err) {
                console.error('Error verifying access token:', err);
            } else {
                console.log('Decoded access token:', decode);
            }
        });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('createTokenPair error:', error);
        throw error;
    }
};

const verifyJWT = async (token: string, keySecret: string) => {
    return JWT.verify(token, keySecret) as Record<string, unknown>;
};

const authentication = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.headers[HEADER.CLIENT_ID] as string;
    if (!userId) throw new UnauthorizedError({ message: 'Invalid Request' });

    const keyStore = await KeyTokenService.fincByUserId(userId);
    if (!keyStore) throw new UnauthorizedError({ message: 'Keys Not Found' });

    const refreshToken = req.cookies?.refreshToken || (req.headers[HEADER.REFRESH_TOKEN] as string);
    if (refreshToken) {
        try {
            const decodeUser = await verifyJWT(refreshToken, keyStore.privateKey);
            if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
            (req as any).keyStore = keyStore;
            (req as any).user = decodeUser;
            return next();
        } catch (error) {
            throw new UnauthorizedError({ message: String(error) });
        }
    }

    const accessToken = req.cookies?.accessToken || (req.headers[HEADER.AUTHORIZATION] as string);
    if (!accessToken) throw new UnauthorizedError({ message: 'Invalid Request. No accessToken' });

    try {
        const decodeUser = await verifyJWT(accessToken, keyStore.privateKey);
        if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
        (req as any).keyStore = keyStore;
        (req as any).user = decodeUser;
        console.log('decodeUser', decodeUser);
        return next();
    } catch (error) {
        throw new UnauthorizedError({ message: String(error) });
    }
});

const socketAuth = async (socket: Socket) => {
    const { accessToken, refreshToken, userId } = socket.handshake.auth as {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
    };
    if (!userId) throw new UnauthorizedError({ message: 'Invalid Request' });

    const keyStore = await KeyTokenService.fincByUserId(userId);
    if (!keyStore) throw new UnauthorizedError({ message: 'Keys Not Found' });

    if (refreshToken) {
        try {
            const decodeUser = await verifyJWT(refreshToken, keyStore.privateKey);
            if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
            return { keyStore, decodeUser };
        } catch (error) {
            throw new UnauthorizedError({ message: String(error) });
        }
    }

    if (!accessToken) throw new UnauthorizedError({ message: 'Invalid Request. No accessToken' });

    try {
        const decodeUser = await verifyJWT(accessToken, keyStore.privateKey);
        if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
        return { keyStore, decodeUser };
    } catch (error) {
        throw new UnauthorizedError({ message: String(error) });
    }
};

export { createTokenPair, verifyJWT, authentication, socketAuth, HEADER };
