'use strict'
const JWT = require('jsonwebtoken');
const { asyncHandler } = require('../helpers/asyncHandler');
const { UnauthorizedError } = require('../core/error.response');
const KeyTokenService = require('../services/keyToken.service');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESH_TOKEN: 'x-refresh-token',
}

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        const accessToken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2 days'
        });

        const refreshToken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7 days'
        });
        JWT.verify(accessToken, publicKey, (err, decode) => {
            if (err) {
                console.error('Error verifying access token:', err);
                throw new Error('Token verification failed');
            } else {
                console.log('Decoded access token:', decode);
            }
        });

        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        console.error('createTokenPair error:', error);
        throw error;
    }
}

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret);
}

const authentication = asyncHandler(async (req, res, next) => {
    const userId = req.headers[HEADER.CLIENT_ID];
    if (!userId) throw new UnauthorizedError({ message: 'Invalid Request' });

    const keyStore = await KeyTokenService.fincByUserId(userId);
    if (!keyStore) throw new UnauthorizedError({ message: 'Keys Not Found' });

    if (req.headers[HEADER.REFRESH_TOKEN]) {
        try {
            const refreshToken = req.headers[HEADER.REFRESH_TOKEN];
            const decodeUser = await verifyJWT(refreshToken, keyStore.privateKey);
            if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
            req.keyStore = keyStore;
            req.user = decodeUser;
            return next();
        } catch (error) {
            throw new UnauthorizedError({ message: error })
        }
    }
    const accessToken = req.headers[HEADER.AUTHORIZATION];
    if (!accessToken) throw new UnauthorizedError({ message: 'Invalid Request. No accessToken' });

    try {
        const decodeUser = await verifyJWT(accessToken, keyStore.privateKey);
        if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
        req.keyStore = keyStore;
        req.user = decodeUser;
        console.log('decodeUser', decodeUser)
        return next();
    } catch (error) {
        throw new UnauthorizedError({ message: error })
    }
});

const socketAuth = async (socket) => {
    const { accessToken, refreshToken, userId } = socket.handshake.auth;
    if (!userId) throw new UnauthorizedError({ message: 'Invalid Request' });

    const keyStore = await KeyTokenService.fincByUserId(userId);
    if (!keyStore) throw new UnauthorizedError({ message: 'Keys Not Found' });

    if (refreshToken) {
        try {
            const decodeUser = await verifyJWT(refreshToken, keyStore.privateKey);
            if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
            return { keyStore, decodeUser };
        } catch (error) {
            throw new UnauthorizedError({ message: error })
        }
    }
    if (!accessToken) throw new UnauthorizedError({ message: 'Invalid Request. No accessToken' });

    try {
        const decodeUser = await verifyJWT(accessToken, keyStore.privateKey);
        if (userId !== decodeUser.userId) throw new UnauthorizedError({ message: 'Invalid User Id' });
        return { keyStore, decodeUser };
    } catch (error) {
        throw new UnauthorizedError({ message: error })
    }
};

module.exports = {
    createTokenPair,
    verifyJWT,
    authentication,
    socketAuth,
}