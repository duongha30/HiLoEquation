'use strict';

const { model, Schema, Types } = require('mongoose');
const DOCUMENT_NAME = 'Room';
const COLLECTION_NAME = 'Room';

const RoomSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['WAITING', 'PLAYING', 'FINISHED'],
        default: 'WAITING',
    },
    maxPlayers: {
        type: Number,
        default: 4,
    },
    password: {
        type: String,
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

