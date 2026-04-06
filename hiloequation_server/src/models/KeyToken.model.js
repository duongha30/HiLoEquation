'use strict';

const { model, Schema, Types } = require('mongoose');
const DOCUMENT_NAME = 'Keys';
const COLLECTION_NAME = 'Keys';

var KeyTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'SHOP',
    },
    publicKey: {
        type: String,
        required: true,
    },
    privateKey: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    refreshTokensUsed: { // proceeded later if someone tries to steal refreshToken
        type: Array,
        default: [],
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME,
});

module.exports = model(DOCUMENT_NAME, KeyTokenSchema);

