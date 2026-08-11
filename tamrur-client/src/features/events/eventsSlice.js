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

/**
 * Creates a new event.
 * @param {{name?: string, type: string, location: {type: "Point", coordinates: [number, number]}}} eventData
 * @returns {Promise<Object>}
 */
export const createEvent = createAsyncThunk(
  "events/create",
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/events", eventData);
      return response.data.event;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create event",
      );
    }
  },
);

/** @type {{events: Array<Object>, status: string, error: string|null, createStatus: string, createError: string|null}} */
const initialState = {
  events: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  createStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: null,
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
      })
      .addCase(createEvent.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.events.unshift(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      });
  },
});

export default eventsSlice.reducer;
