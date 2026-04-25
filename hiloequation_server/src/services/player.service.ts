import PlayerModel from '../models/Player.model';
import type { IPlayerService, FindByEmailParams } from '../interfaces/IPlayerService';

const findByEmail = async ({ email, select = { email: 1, password: 1, name: 1, status: 1 } }: FindByEmailParams) => {
    return await PlayerModel.findOne({ email }).select(select).lean();
};

export { findByEmail };
