// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches every vitals reading logged across an event, newest first.
 *
 * One request per event rather than per casualty: the medic interface shows
 * the whole casualty table at once and groups these rows by "injury-id".
 *
 * @param {string} eventId
 * @returns {Promise<{eventId: string, vitals: Array<Object>}>}
 */
export const fetchVitalsByEvent = createAsyncThunk(
  "vitals/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/vitals/by-event/${eventId}`);
      return { eventId, vitals: response.data.vitalsRecords };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load vitals",
      );
    }
  },
);

/**
 * Logs a vitals reading against a casualty.
 *
 * @param {{ eventId: string, injuryId: string, recordedAt: string, measurements: Object }} params
 * @returns {Promise<Object>} The created vitals row.
 */
export const createVitals = createAsyncThunk(
  "vitals/create",
  async ({ eventId, injuryId, recordedAt, measurements }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/vitals", {
        eventId,
        injuryId,
        recordedAt,
        ...measurements,
      });
      return response.data.vitals;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create vitals record",
      );
    }
  },
);

/**
 * Updates one vitals row, addressed by its own id.
 *
 * `/vitals/:eventId` addresses every row belonging to the event, so
 * per-record edits go through the `/record/:id` route instead.
 *
 * @param {{ id: string, recordedAt: string, measurements: Object }} params
 * @returns {Promise<Object>} The updated vitals row.
 */
export const updateVitals = createAsyncThunk(
  "vitals/update",
  async ({ id, recordedAt, measurements }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/vitals/record/${id}`, {
        recordedAt,
        ...measurements,
      });
      return response.data.vitals;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update vitals record",
      );
    }
  },
);

/**
 * Deletes one vitals row, addressed by its own id.
 *
 * @param {{ id: string }} params
 * @returns {Promise<Object>} The deleted vitals row.
 */
export const deleteVitals = createAsyncThunk(
  "vitals/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.delete(`/vitals/record/${id}`);
      return response.data.vitals;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to delete vitals record",
      );
    }
  },
);

/**
 * Keyed by event id, mirroring the treatments slice — components derive a
 * single casualty's readings by filtering on "injury-id".
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null, saveStatus: string, saveError: string|null}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  saveStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
};

/** Newest first, matching the order the server returns. */
function sortByRecordedAtDesc(records) {
  return records.sort(
    (a, b) => new Date(b["recorded-at"]).getTime() - new Date(a["recorded-at"]).getTime(),
  );
}

/**
 * Vitals slice: holds each event's `vitals` rows.
 */
const vitalsSlice = createSlice({
  name: "vitals",
  initialState,
  reducers: {
    /** Clears a failed save so a reopened form doesn't show a stale error. */
    clearVitalsSaveError(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVitalsByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchVitalsByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.vitals;
      })
      .addCase(fetchVitalsByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createVitals.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createVitals.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = sortByRecordedAtDesc([
          ...(state.byEventId[eventId] || []),
          action.payload,
        ]);
      })
      .addCase(createVitals.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateVitals.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateVitals.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        const records = state.byEventId[eventId] || [];
        const index = records.findIndex((record) => record.id === action.payload.id);
        if (index !== -1) {
          records[index] = action.payload;
          // The edit may have moved the record in time.
          state.byEventId[eventId] = sortByRecordedAtDesc(records);
        }
      })
      .addCase(updateVitals.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(deleteVitals.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(deleteVitals.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = (state.byEventId[eventId] || []).filter(
          (record) => record.id !== action.payload.id,
        );
      })
      .addCase(deleteVitals.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      });
  },
});

export const { clearVitalsSaveError } = vitalsSlice.actions;

export default vitalsSlice.reducer;