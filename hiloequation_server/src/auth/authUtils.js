'use strict'
const JWT = require('jsonwebtoken');
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

module.exports = {
    createTokenPair
}