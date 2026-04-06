'use strict'
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
                new: true, // If true, returns the updated document instead of the original one
                setDefaultsOnInsert: true, // Ensures that any default values specified in the schema are set on the newly created document.
            };
            const token = await keyTokenModel.findOneAndUpdate(filter, update, options);
            return token ? token.publicKey : null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = KeyTokenService;