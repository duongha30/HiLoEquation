import { model, Schema, Types } from 'mongoose';

const DOCUMENT_NAME = 'Keys';
const COLLECTION_NAME = 'Keys';

const KeyTokenSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, required: true, ref: 'SHOP' },
        publicKey: { type: String, required: true },
        privateKey: { type: String, required: true },
        refreshToken: { type: String, required: true },
        refreshTokensUsed: { type: Array, default: [] },
    },
    { timestamps: true, collection: COLLECTION_NAME },
);

export default model(DOCUMENT_NAME, KeyTokenSchema);
