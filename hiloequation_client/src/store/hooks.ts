import type { RootState, AppDispatch } from './store'
import { useDispatch, useSelector, useStore } from 'react-redux';
import { createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { AppStore } from './store'

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: RootState;
    dispatch: AppDispatch;
}>();
export const createAppSelector = createSelector.withTypes<RootState>();

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();