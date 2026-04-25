import { OK } from '../core/success.response';
import { AccessService } from '../services/access.service';
import type { Request, Response } from 'express';

class AccessController {
    logout = async (req: Request, res: Response) => {
        new OK({
            message: 'Logout successfully',
            metadata: await AccessService.logout({ keyStore: (req as any).keyStore }),
        }).send(res);
    };

    login = async (req: Request, res: Response) => {
        const result = await AccessService.login(req.body);
        AccessService.setCookies(res, result.tokens);
        new OK({
            message: 'Login successfully',
            metadata: { user: result.user },
        }).send(res);
    };

    signUp = async (req: Request, res: Response) => {
        const result = await AccessService.signUp(req.body);
        AccessService.setCookies(res, result.tokens);
        new OK({
            message: 'Sign up new player successfully',
            metadata: { user: result.user },
        }).send(res);
    };
}

export default new AccessController();
