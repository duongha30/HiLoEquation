import { createAsyncThunk } from "@reduxjs/toolkit";

export const playerAction = createAsyncThunk('player/test', async () => {
    try {
    } catch (err) {
        throw new Error('NETWORK_ERROR');
    }
});