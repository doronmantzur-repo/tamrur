// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches all casualties recorded for an event.
 * @param {string} eventId
 * @returns {Promise<{eventId: string, casualties: Array<Object>}>}
 */
export const fetchCasualtiesByEvent = createAsyncThunk(
  "casualties/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/casualties/${eventId}`);
      return { eventId, casualties: response.data.casualties };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load casualties",
      );
    }
  },
);

/**
 * Adds a casualty to an event's table.
 *
 * `fields` uses the server's kebab-case body keys ("evac-priority",
 * "evac-ability", "recommended-evac-dest", "evac-ready") rather than camelCase,
 * because that's what the casualties controller destructures.
 *
 * @param {{ eventId: string, fields: Object }} params
 * @returns {Promise<Object>} The created casualty row.
 */
export const createCasualty = createAsyncThunk(
  "casualties/create",
  async ({ eventId, fields }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/casualties", { eventId, ...fields });
      return response.data.casualty;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create casualty",
      );
    }
  },
);

/**
 * Updates a casualty's details.
 *
 * The server writes exactly the keys present in `fields` and leaves every other
 * column alone, so sending an explicit `null` clears a value — which is what
 * lets the casualty table uncheck a treatment or blank out a note.
 *
 * @param {{ id: string, fields: Object }} params
 * @returns {Promise<Object>} The updated casualty row.
 */
export const updateCasualty = createAsyncThunk(
  "casualties/update",
  async ({ id, fields }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/casualties/${id}`, fields);
      return response.data.casualty;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update casualty",
      );
    }
  },
);

/**
 * Keyed by event id, since more than one event's casualties can be on screen at
 * once (e.g. the airforce page lists every event needing aerial evac).
 * `savingById` tracks in-flight row saves individually, so the casualty table
 * can spin only the row being saved instead of every row at once.
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null, saveStatus: string, saveError: string|null, savingById: Object<string, boolean>, rowErrorById: Object<string, string>}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  saveStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
  savingById: {},
  rowErrorById: {},
};

/**
 * Casualties slice: holds each fetched event's casualties, keyed by event id.
 */
const casualtiesSlice = createSlice({
  name: "casualties",
  initialState,
  reducers: {
    /** Clears a failed save so a reopened form doesn't show a stale error. */
    clearCasualtySaveError(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },

    /** Dismisses one row's inline save error in the casualty table. */
    clearCasualtyRowError(state, action) {
      delete state.rowErrorById[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCasualtiesByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCasualtiesByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.casualties;
      })
      .addCase(fetchCasualtiesByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createCasualty.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createCasualty.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = [...(state.byEventId[eventId] || []), action.payload];
      })
      .addCase(createCasualty.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      // `action` is needed here: the row-level save state is keyed by the
      // casualty id carried on the thunk argument.
      .addCase(updateCasualty.pending, (state, action) => {
        state.saveStatus = "loading";
        state.saveError = null;
        state.savingById[action.meta.arg.id] = true;
        delete state.rowErrorById[action.meta.arg.id];
      })
      .addCase(updateCasualty.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        delete state.savingById[action.meta.arg.id];
        const casualties = state.byEventId[action.payload["event-id"]] || [];
        const index = casualties.findIndex((casualty) => casualty.id === action.payload.id);
        if (index !== -1) {
          casualties[index] = action.payload;
        }
      })
      .addCase(updateCasualty.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
        delete state.savingById[action.meta.arg.id];
        state.rowErrorById[action.meta.arg.id] = action.payload;
      });
  },
});

export const { clearCasualtySaveError, clearCasualtyRowError } = casualtiesSlice.actions;

export default casualtiesSlice.reducer;
