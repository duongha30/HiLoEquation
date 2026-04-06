'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { BadRequestError } = require('../core/error.response');
const playerModel = require('../models/Player.model');
const keyTokenService = require('../services/keyToken.service');
const { createTokenPair } = require('../auth/authUtils');
const { getInfoData } = require('../utils');


class AccessService {
    static async signUp(req) {
        const { name, email, password } = req;
        const player = await playerModel.findOne({ email }).lean();
        if (!!player) {
            throw new BadRequestError('player already existing!');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newPlayer = await playerModel.create({
            name,
            email,
            password: passwordHash,
            status: 'active'
        });

        if (!newPlayer) {
            throw new BadRequestError('Failed to create player');
        }

        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        });
        const keyStore = await keyTokenService.createKeyToken({
            userId: newPlayer._id,
            publicKey,
            privateKey,
        });

        if (!keyStore) {
            throw new BadRequestError('Failed to store keys');
        }

        const tokenPair = await createTokenPair({
            userId: newPlayer._id,
            email,
        }, publicKey, privateKey);

        return {
            code: '201',
            user: getInfoData({
                fields: ['_id', 'name', 'email'],
                object: newPlayer,
            }),
            tokens: tokenPair,
        }
    }
}

module.exports = { AccessService };