// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches the full forces list (the static reference table of units shown
 * on the map). Like locations, this isn't scoped per event — it's one
 * global reference list.
 * @returns {Promise<Array<Object>>}
 */
export const fetchForces = createAsyncThunk(
  "forces/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get("/forces");
      return response.data.forces;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load forces",
      );
    }
  },
);

/** @type {{forces: Array<Object>, status: string, error: string|null}} */
const initialState = {
  forces: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Forces slice: holds the global static reference list of forces shown on
 * the map.
 */
const forcesSlice = createSlice({
  name: "forces",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchForces.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchForces.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.forces = action.payload;
      })
      .addCase(fetchForces.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default forcesSlice.reducer;
