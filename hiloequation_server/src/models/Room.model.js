'use strict';

const { model, Schema, Types } = require('mongoose');
const DOCUMENT_NAME = 'Room';
const COLLECTION_NAME = 'Room';

const RoomSchema = new Schema({
    roomCode: {
        type: String,
        unique: true,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    maxPlayers: {
        type: Number,
        default: 4,
    },
    password: {
        type: String,
        unique: true,
    },
    hostId: {
        type: Types.ObjectId,
        ref: 'Player',
        required: true,
    },
    players: [{
        type: Types.ObjectId,
        ref: 'Player',
    }],
}, {
    timestamps: true,
    collection: COLLECTION_NAME,
});

module.exports = model(DOCUMENT_NAME, RoomSchema);

