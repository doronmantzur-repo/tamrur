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
 * Adds a casualty to an event's table.
 *
 * `fields` uses the server's kebab-case body keys ("evac-priority",
 * "evac-ability", "recommended-evac-dest", "evac-ready") rather than camelCase,
 * because that's what the injuries controller destructures.
 *
 * @param {{ eventId: string, fields: Object }} params
 * @returns {Promise<Object>} The created injury row.
 */
export const createInjury = createAsyncThunk(
  "injuries/create",
  async ({ eventId, fields }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/injuries", { eventId, ...fields });
      return response.data.injury;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create injury",
      );
    }
  },
);

/**
 * Updates a casualty's details.
 *
 * The server COALESCEs every column, so omitting a field leaves it untouched —
 * but it also means a field can't be cleared back to null through this route.
 *
 * @param {{ id: string, fields: Object }} params
 * @returns {Promise<Object>} The updated injury row.
 */
export const updateInjury = createAsyncThunk(
  "injuries/update",
  async ({ id, fields }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/injuries/${id}`, fields);
      return response.data.injury;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update injury",
      );
    }
  },
);

/**
 * Keyed by event id, since more than one event's injuries can be on screen at
 * once (e.g. the airforce page lists every event needing aerial evac).
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null, saveStatus: string, saveError: string|null}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  saveStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
};

/**
 * Injuries slice: holds each fetched event's injuries, keyed by event id.
 */
const injuriesSlice = createSlice({
  name: "injuries",
  initialState,
  reducers: {
    /** Clears a failed save so a reopened form doesn't show a stale error. */
    clearInjurySaveError(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
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
      })
      .addCase(createInjury.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createInjury.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = [...(state.byEventId[eventId] || []), action.payload];
      })
      .addCase(createInjury.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateInjury.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateInjury.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const injuries = state.byEventId[action.payload["event-id"]] || [];
        const index = injuries.findIndex((injury) => injury.id === action.payload.id);
        if (index !== -1) {
          injuries[index] = action.payload;
        }
      })
      .addCase(updateInjury.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      });
  },
});

export const { clearInjurySaveError } = injuriesSlice.actions;

export default injuriesSlice.reducer;