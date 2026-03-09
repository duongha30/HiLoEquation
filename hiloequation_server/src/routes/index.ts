'use strict';

import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

//check api key
// router.use(apiKey);
// //check permission
// router.use(checkApiKeyPermission('0000'));

router.use('/v1/api', async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({        status: 'success',
        message: 'Welcome to Hiloequation API',
    });
});

export default router;