import type { RootState, AppDispatch } from './store'
import type { ActionReducerMapBuilder, AsyncThunk, CaseReducer } from '@reduxjs/toolkit';
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

export type AppAsyncThunkActionCases<
    ReducerName extends keyof RootState,
    A extends AsyncThunk<any, any, any>,
> =
    A extends AsyncThunk<infer Returned, infer ThunkArg, infer ThunkApiConfig>
    ? {
        pending?: CaseReducer<
            RootState[ReducerName],
            ReturnType<AsyncThunk<Returned, ThunkArg, ThunkApiConfig>['pending']>
        >;
        rejected?: CaseReducer<
            RootState[ReducerName],
            ReturnType<AsyncThunk<Returned, ThunkArg, ThunkApiConfig>['rejected']>
        >;
        fulfilled: CaseReducer<
            RootState[ReducerName],
            ReturnType<AsyncThunk<Returned, ThunkArg, ThunkApiConfig>['fulfilled']>
        >;
    }
    : never;

type CompositeBuilder<R extends keyof RootState> = {
    addCases: <A extends AsyncThunk<any, any, any>>(
        action: A,
        cases: AppAsyncThunkActionCases<R, A>,
    ) => CompositeBuilder<R>;
};

export const compositeBuilder = <R extends keyof RootState>(
    builder: ActionReducerMapBuilder<RootState[R]>,
): CompositeBuilder<R> => ({
    addCases(action, cases) {
        if (cases.pending) {
            builder.addCase(action.pending, cases.pending);
        }
        builder.addCase(action.fulfilled, cases.fulfilled);
        if (cases.rejected) {
            builder.addCase(action.rejected, cases.rejected);
        }

        return this;
    },
});