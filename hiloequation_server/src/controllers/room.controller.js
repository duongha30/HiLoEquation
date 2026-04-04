'use strict';

const { OK } = require('../core/success.response');
const { RoomService } = require('../services/room.service');

class RoomController {
    createRoom = async (req, res) => {
        new OK({
            message: "Create new room successfully",
            metadata: await RoomService.createRoom({
                ...req.body
            })
        }).send(res);
    }
}

module.exports = new RoomController();