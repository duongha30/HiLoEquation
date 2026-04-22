'use strict';

const { OK } = require('../core/success.response');
const RoomService = require('../services/room.service');

class RoomController {
    createRoom = async (req, res) => {
        new OK({
            message: "Create new room successfully",
            metadata: await RoomService.createRoom({
                ...req.body
            })
        }).send(res);
    }

    getRoomById = async (req, res) => {
        const { roomId } = req.params;
        new OK({
            message: "Get room successfully",
            metadata: await RoomService.getRoomById({ roomId })
        }).send(res);
    }

    accessRoom = async (req, res) => {
        new OK({
            message: "Access room successfully",
            metadata: await RoomService.accessRoom({ ...req.body })
        }).send(res);
    }
}

module.exports = new RoomController();