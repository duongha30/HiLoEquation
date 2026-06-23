import { Types } from 'mongoose';
import PlayerModel from '../models/Player.model';
import type { IPlayerService, FindByEmailParams } from '../interfaces/IPlayerService';
import type { HandsType } from '../game/types';

const findByEmail = async ({ email, select = { email: 1, password: 1, name: 1, status: 1 } }: FindByEmailParams) => {
    return await PlayerModel.findOne({ email }).select(select).lean();
};

const getCashMap = async (playerIds: string[]): Promise<Record<string, number>> => {
    const validIds = (playerIds ?? []).filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return {};
    const players = await PlayerModel.find({ _id: { $in: validIds } }, { _id: 1, cash: 1 }).lean();
    const map: Record<string, number> = {};
    for (const p of players) map[String(p._id)] = (p.cash as number) ?? 2000;
    return map;
};

const updateCash = async (playerId: string, cash: number): Promise<void> => {
    if (!Types.ObjectId.isValid(playerId) || typeof cash !== 'number') return;
    await PlayerModel.updateOne({ _id: playerId }, { $set: { cash } });
};

const bulkUpdateCash = async (hands: HandsType): Promise<void> => {
    await Promise.all(
        Object.entries(hands)
            .filter(([id]) => Types.ObjectId.isValid(id))
            .map(([id, hand]) => PlayerModel.updateOne({ _id: id }, { $set: { cash: hand.cash } })),
    );
};

export { findByEmail, getCashMap, updateCash, bulkUpdateCash };
