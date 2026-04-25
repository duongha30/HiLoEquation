import PlayerModel from '../models/Player.model';

const findByEmail = async ({ email, select = { email: 1, password: 1, name: 1, status: 1 } }: {
    email: string;
    select?: Record<string, number>;
}) => {
    return await PlayerModel.findOne({ email }).select(select).lean();
};

export { findByEmail };
