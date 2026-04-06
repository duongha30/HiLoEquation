'use strict';

const bcrypt = require('bcrypt');
const { BadRequestError, UnauthorizedError } = require('../core/error.response');
const playerModel = require('../models/Player.model');
const keyTokenService = require('../services/keyToken.service');
const { getInfoData, generateAuthTokens } = require('../utils');
const { findByEmail } = require('./player.service');

class AccessService {
    static async logout({ keyStore }) {
        console.log('keyStore', keyStore)
        const delKey = await keyTokenService.removeKeyById(keyStore._id);
        return delKey;
    }

    static async login(req) {
        const { email, password, refreshToken = null } = req;
        const player = await findByEmail({ email });
        if (!player) throw new BadRequestError({ message: 'User not found' })

        const isMatching = bcrypt.compare(password, player.password);
        if (!isMatching) throw new UnauthorizedError({ message: 'Authentication error' })

        const { tokenPair, privateKey, publicKey } = await generateAuthTokens({ user: player, email });
        const keyStore = await keyTokenService.createKeyToken({
            userId: player._id,
            publicKey,
            privateKey,
            refreshToken: tokenPair.refreshToken,
        });
        if (!keyStore) {
            throw new BadRequestError({ message: 'Failed to store keys' });
        }
        return {
            user: getInfoData({
                fields: ['_id', 'name', 'email'],
                object: player,
            }),
            tokens: tokenPair,
        }
    }

    static async signUp(req) {
        const { name, email, password } = req;
        console.log('email', email)
        const player = await playerModel.findOne({ email }).lean();
        if (!!player) {
            throw new BadRequestError({ message: 'player already existing!' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newPlayer = await playerModel.create({
            name,
            email,
            password: passwordHash,
            status: 'active'
        });

        if (!newPlayer) {
            throw new BadRequestError({ message: 'Failed to create player' });
        }
        const { tokenPair, privateKey, publicKey } = await generateAuthTokens({ user: newPlayer, email });

        const keyStore = await keyTokenService.createKeyToken({
            userId: newPlayer._id,
            publicKey,
            privateKey,
            refreshToken: tokenPair.refreshToken,
        });

        if (!keyStore) {
            throw new BadRequestError({ message: 'Failed to store keys' });
        }

        return {
            user: getInfoData({
                fields: ['_id', 'name', 'email'],
                object: newPlayer,
            }),
            tokens: tokenPair,
        }
    }
}

module.exports = { AccessService };