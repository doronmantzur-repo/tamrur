// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches every event in the system.
 * @returns {Promise<Array<Object>>}
 */
export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get("/events");
      return response.data.events;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load events",
      );
    }
  },
);

/** @type {{events: Array<Object>, status: string, error: string|null}} */
const initialState = {
  events: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Events slice: holds the list of every event for selection UI (e.g. the dashboard's event dropdown).
 */
const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default eventsSlice.reducer;
