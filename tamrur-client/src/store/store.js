// External
import { configureStore } from "@reduxjs/toolkit";

// Internal
import authReducer from "../features/auth/authSlice";

/**
 * Root Redux store. Combines all feature reducers.
 * @see features/auth/authSlice.js
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
