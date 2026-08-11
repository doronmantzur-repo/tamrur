// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches all injuries recorded for an event.
 * @param {string} eventId
 * @returns {Promise<Array<Object>>}
 */
export const fetchInjuriesByEvent = createAsyncThunk(
  "injuries/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/injuries/${eventId}`);
      return response.data.injuries;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load injuries",
      );
    }
  },
);

/** @type {{injuries: Array<Object>, status: string, error: string|null}} */
const initialState = {
  injuries: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Injuries slice: holds the injuries for whichever event is currently selected on the dashboard.
 */
const injuriesSlice = createSlice({
  name: "injuries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInjuriesByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInjuriesByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.injuries = action.payload;
      })
      .addCase(fetchInjuriesByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default injuriesSlice.reducer;
