import _ from 'lodash';
import crypto from 'crypto';
import { createTokenPair } from '../auth/authUtils';

const getInfoData = ({ fields = [] as string[], object = {} as Record<string, unknown> }) => {
    return _.pick(object, fields);
};

const generateAuthTokens = async ({ user, email }: { user: Record<string, unknown>; email: string }) => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    const tokenPair = await createTokenPair({ userId: user._id, email }, publicKey, privateKey);

    return { tokenPair, privateKey, publicKey };
};

export { getInfoData, generateAuthTokens };
