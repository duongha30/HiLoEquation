import { Types } from 'mongoose';
import KeyTokenModel from '../models/KeyToken.model';

class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }: {
        userId: string | Types.ObjectId;
        publicKey: string;
        privateKey: string;
        refreshToken: string;
    }) => {
        try {
            const filter = { user: userId };
            const update = { publicKey, privateKey, refreshToken, refreshTokenUsed: [] };
            const options = { upsert: true, setDefaultsOnInsert: true };
            const result = await KeyTokenModel.updateOne(filter, { $set: update }, options);
            return result.acknowledged ? publicKey : null;
        } catch (error) {
            throw error;
        }
    };

    static fincByUserId = async (userId: string) => {
        return await KeyTokenModel.findOne({ user: new Types.ObjectId(userId) }).lean();
    };

    static removeKeyById = async (id: string | Types.ObjectId) => {
        return await KeyTokenModel.deleteOne({ _id: id });
    };
}

export default KeyTokenService;
