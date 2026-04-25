import { OK } from '../core/success.response';
import RoomService from '../services/room.service';
import type { Request, Response } from 'express';

class RoomController {
    createRoom = async (req: Request, res: Response) => {
        new OK({
            message: 'Create new room successfully',
            metadata: await RoomService.createRoom({ ...req.body }),
        }).send(res);
    };

    getRoomById = async (req: Request, res: Response) => {
        const roomId = req.params.roomId as string;
        new OK({
            message: 'Get room successfully',
            metadata: await RoomService.getRoomById({ roomId }),
        }).send(res);
    };

    accessRoom = async (req: Request, res: Response) => {
        new OK({
            message: 'Access room successfully',
            metadata: await RoomService.accessRoom({ ...req.body }),
        }).send(res);
    };
}

export default new RoomController();
