'use strict';

const { model, Schema, Types } = require('mongoose');
const DOCUMENT_NAME = 'Player';
const COLLECTION_NAME = 'Player';

var PlayerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    currentRoomId: {
        type: Types.ObjectId,
        ref: 'Room',
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    isHost: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME,
});

module.exports = model(DOCUMENT_NAME, PlayerSchema);

