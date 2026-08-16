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
 * `rollbackById` holds the pre-write values of an optimistically applied update,
 * so a rejected save can put the row back exactly as it was.
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null, saveStatus: string, saveError: string|null, savingById: Object<string, boolean>, rowErrorById: Object<string, string>, rollbackById: Object<string, Object>}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  saveStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
  savingById: {},
  rowErrorById: {},
  rollbackById: {},
};

/**
 * Finds a casualty row across every loaded event.
 *
 * @param {Object} state - The slice state.
 * @param {string} casualtyId
 * @returns {Object | undefined} The row, if it is loaded.
 */
function findCasualty(state, casualtyId) {
  for (const casualties of Object.values(state.byEventId)) {
    const found = casualties.find((casualty) => casualty.id === casualtyId);
    if (found) return found;
  }

  return undefined;
}

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
        const { id, fields } = action.meta.arg;
        state.saveStatus = "loading";
        state.saveError = null;
        state.savingById[id] = true;
        delete state.rowErrorById[id];

        // Applied optimistically: ticking "פונה" has to move the casualty out of
        // the active table on the click, not a round trip later. The previous
        // values are kept so a rejected save can put the row back.
        const casualty = findCasualty(state, id);
        if (!casualty) return;

        state.rollbackById[id] = Object.fromEntries(
          Object.keys(fields).map((key) => [key, casualty[key]]),
        );
        Object.assign(casualty, fields);
      })
      .addCase(updateCasualty.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        delete state.savingById[action.meta.arg.id];
        delete state.rollbackById[action.meta.arg.id];

        // The server row is authoritative — it carries fields the optimistic
        // patch couldn't know, such as the stamped evacuated_at.
        const casualties = state.byEventId[action.payload["event-id"]] || [];
        const index = casualties.findIndex((casualty) => casualty.id === action.payload.id);
        if (index !== -1) {
          casualties[index] = action.payload;
        }
      })
      .addCase(updateCasualty.rejected, (state, action) => {
        const { id } = action.meta.arg;
        state.saveStatus = "failed";
        state.saveError = action.payload;
        delete state.savingById[id];
        state.rowErrorById[id] = action.payload;

        const casualty = findCasualty(state, id);
        const rollback = state.rollbackById[id];
        if (casualty && rollback) {
          Object.assign(casualty, rollback);
        }
        delete state.rollbackById[id];
      });
  },
});

export const { clearCasualtySaveError, clearCasualtyRowError } = casualtiesSlice.actions;

export default casualtiesSlice.reducer;
