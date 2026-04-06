'use strict'
const { Types } = require('mongoose');
const keyTokenModel = require('../models/KeyToken.model');
class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }) => {
        try {
            const filter = {
                user: userId,
            }
            const update = {
                publicKey,
                privateKey,
                refreshToken,
                refreshTokenUsed: [],
            }
            const options = {
                upsert: true, // If true, creates a new document if no matching document is found
                setDefaultsOnInsert: true, // Ensures that any default values specified in the schema are set on the newly created document.
            };
            const result = await keyTokenModel.updateOne(filter, { $set: update }, options);
            return result.acknowledged ? publicKey : null;
        } catch (error) {
            throw error;
        }
    }

    static fincByUserId = async (userId) => {
        return await keyTokenModel.findOne({ user: new Types.ObjectId(userId) }).lean();
    }
    static removeKeyById = async (id) => {
        return await keyTokenModel.deleteOne({ _id: id });
    }
}

module.exports = KeyTokenService;