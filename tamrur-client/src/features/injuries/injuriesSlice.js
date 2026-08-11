// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches all injuries recorded for an event.
 * @param {string} eventId
 * @returns {Promise<{eventId: string, injuries: Array<Object>}>}
 */
export const fetchInjuriesByEvent = createAsyncThunk(
  "injuries/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/injuries/${eventId}`);
      return { eventId, injuries: response.data.injuries };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load injuries",
      );
    }
  },
);

/**
 * Keyed by event id, since more than one event's injuries can be on screen at
 * once (e.g. the airforce page lists every event needing aerial evac).
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Injuries slice: holds each fetched event's injuries, keyed by event id.
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
        state.byEventId[action.payload.eventId] = action.payload.injuries;
      })
      .addCase(fetchInjuriesByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default injuriesSlice.reducer;
