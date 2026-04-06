import { combineReducers, configureStore } from '@reduxjs/toolkit';
import type { Reducer, UnknownAction } from '@reduxjs/toolkit';
import { createMigrate, createTransform, persistStore, persistReducer } from 'redux-persist';
import type { PersistPartial } from 'redux-persist/es/persistReducer';
import type { Storage } from 'redux-persist';
import roomReducer from './reducers/room';
import socketReducer from './reducers/socket';

type PersistedRootState = RootState & PersistPartial;

export const rootReducer = combineReducers({
  roomReducer,
  socketReducer,
});

export const initStore = (storage: Storage) => {
  const storeVersion = 1;
  const migrate = createMigrate({
    // No migration for version 1
    1: () => ({
      _persist: { rehydrated: false, version: storeVersion },
    }),
  });
  const transformState = createTransform<PersistedRootState, RootState>(() => { }, () => { }, { whitelist: [] });
  const persistConfig = {
    key: 'root',
    storage,
    migrate,
    transforms: [transformState],
  };
  const persistedReducer: Reducer<PersistedRootState, UnknownAction> =
    persistReducer<RootState, UnknownAction>(persistConfig, rootReducer);
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
}

export type AppStore = ReturnType<typeof initStore>['store'];
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];