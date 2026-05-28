import { configureStore, combineReducers } from '@reduxjs/toolkit';

import app from 'src/redux/App/slice';
import country from 'src/redux/Country/slice';
import regional from 'src/redux/Regional/slice';
import state from 'src/redux/State/slice';

export const rootReducer = combineReducers({
    app,
    country,
    regional,
    state,
});

export const store = configureStore({
    reducer: rootReducer,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
