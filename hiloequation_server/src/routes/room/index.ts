import express from 'express';
import roomController from '../../controllers/room.controller';
import { asyncHandler } from '../../helpers/asyncHandler';
import { authentication } from '../../auth/authUtils';

const router = express.Router();

router.use(authentication);
router.get('/room/:roomId', asyncHandler(roomController.getRoomById));
router.post('/room/create', asyncHandler(roomController.createRoom));
router.post('/room/join', asyncHandler(roomController.accessRoom));

export default router;
