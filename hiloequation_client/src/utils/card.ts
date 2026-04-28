import type { CardData } from '@/types/card';

async function deriveKey(playerId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(playerId + 'salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return crypto.subtle.importKey('raw', hashBuffer, 'AES-CBC', false, ['decrypt']);
}

export async function decryptCard(card: CardData, playerId: string): Promise<CardData> {
    if (!card.encryptedData) return card;

    try {
        const buffer = Uint8Array.from(atob(card.encryptedData), c => c.charCodeAt(0));
        const iv = buffer.slice(0, 16);
        const ciphertext = buffer.slice(16);

        const key = await deriveKey(playerId);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext);
        const payload = JSON.parse(new TextDecoder().decode(decrypted)) as Pick<CardData, 'id' | 'type' | 'suit' | 'value'>;

        return { ...payload };
    } catch (e) {
        console.error('Failed to decrypt card:', e);
        return card;
    }
}

export async function decryptCards(cards: CardData[], playerId: string): Promise<CardData[]> {
    return Promise.all(cards.map(card => decryptCard(card, playerId)));
}
