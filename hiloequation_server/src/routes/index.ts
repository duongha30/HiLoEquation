import express from 'express';
import roomRouter from './room/index';
import accessRouter from './access/index';

const router = express.Router();

router.use('/v1/api', accessRouter);
router.use('/v1/api', roomRouter);

export default router;
