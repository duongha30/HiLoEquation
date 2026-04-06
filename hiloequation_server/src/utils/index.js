const _ = require('lodash');
const crypto = require('crypto');
const { createTokenPair } = require('../auth/authUtils');

const getInfoData = ({ fields = [], object = {} }) => {
    return _.pick(object, fields);
}

const generateAuthTokens = async ({ user, email }) => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    const tokenPair = await createTokenPair({
        userId: user._id,
        email,
    }, publicKey, privateKey);

    return {
        tokenPair,
        privateKey,
        publicKey,
    }
}
module.exports = {
    getInfoData,
    generateAuthTokens,
}