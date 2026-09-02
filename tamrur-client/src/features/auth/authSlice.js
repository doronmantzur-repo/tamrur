// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";
import { saveSession, loadSession, clearSession } from "./authStorage";

/**
 * Registers a new user.
 * @param {Object} credentials
 * @param {string} credentials.role
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{user: Object, token: string}>}
 */
export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ role, email, password }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/auth/register", {
        role,
        email,
        password,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Registration failed",
      );
    }
  },
);

/**
 * Logs in an existing user.
 * @param {Object} credentials
 * @param {string} credentials.role
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{user: Object, token: string}>}
 */
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Login failed");
    }
  },
);

const restored = loadSession();

/** @type {{user: Object|null, token: string|null, status: string, error: string|null}} */
const initialState = {
  user: restored?.user ?? null,
  token: restored?.token ?? null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Auth slice: handles register/login state and session data.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Clears the current session. */
    logout: (state) => {
      state.user = null;
      state.token = null;
      clearSession();
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        saveSession({
          token: action.payload.token,
          user: action.payload.user,
          rememberMe: action.meta.arg.rememberMe,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
