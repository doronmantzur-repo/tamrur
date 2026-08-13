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

/**
 * Fetches a single event by id — used by pages focused on one event (e.g.
 * the brigade dashboard) instead of pulling the full list.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const fetchEventById = createAsyncThunk(
  "events/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/events/${id}`);
      return response.data.event;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load event",
      );
    }
  },
);

/**
 * Updates an event (status, name, type, location, closure_at, aerialEvac).
 * @param {{ id: string, changes: Object }} params
 * @returns {Promise<Object>}
 */
export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/events/${id}`, changes);
      return response.data.event;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update event",
      );
    }
  },
);

/**
 * @type {{
 *   events: Array<Object>,
 *   status: string,
 *   error: string|null,
 *   createStatus: string,
 *   createError: string|null,
 *   currentEvent: Object|null,
 *   currentEventStatus: string,
 *   currentEventError: string|null,
 *   updateStatus: string,
 *   updateError: string|null,
 * }}
 */
const initialState = {
  events: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  createStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: null,
  currentEvent: null,
  currentEventStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  currentEventError: null,
  updateStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  updateError: null,
};

/**
 * Events slice: holds the list of every event for selection UI (e.g. the
 * dashboard's event dropdown), plus a separately-tracked `currentEvent` for
 * pages focused on one event (e.g. the brigade dashboard) that fetch and
 * update it directly by id instead of pulling the full list.
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
      })
      .addCase(fetchEventById.pending, (state) => {
        state.currentEventStatus = "loading";
        state.currentEventError = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.currentEventStatus = "succeeded";
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.currentEventStatus = "failed";
        state.currentEventError = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
        const index = state.events.findIndex((event) => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload;
      });
  },
});

export default eventsSlice.reducer;
