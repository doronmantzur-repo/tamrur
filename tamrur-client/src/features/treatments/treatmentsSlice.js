// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches every treatment logged across an event, newest first.
 *
 * One request per event rather than per casualty: the medic interface shows
 * the whole casualty table at once and groups these rows by "injury-id".
 *
 * @param {string} eventId
 * @returns {Promise<{eventId: string, treatments: Array<Object>}>}
 */
export const fetchTreatmentsByEvent = createAsyncThunk(
  "treatments/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/casualties-treatment/by-event/${eventId}`);
      return { eventId, treatments: response.data.casualtyTreatments };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load treatments",
      );
    }
  },
);

/**
 * Logs a treatment against a casualty.
 *
 * @param {{ eventId: string, injuryId: string, treatment: string, recordedAt: string }} params
 * @returns {Promise<Object>} The created treatment row.
 */
export const createTreatment = createAsyncThunk(
  "treatments/create",
  async ({ eventId, injuryId, treatment, recordedAt }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/casualties-treatment", {
        eventId,
        injuryId,
        treatment,
        recordedAt,
      });
      return response.data.casualtyTreatment;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create treatment",
      );
    }
  },
);

/**
 * Updates one treatment row, addressed by its own id.
 *
 * `/casualties-treatment/:eventId` addresses every row belonging to the event,
 * so per-record edits go through the `/record/:id` route instead.
 *
 * @param {{ id: string, treatment: string, recordedAt: string }} params
 * @returns {Promise<Object>} The updated treatment row.
 */
export const updateTreatment = createAsyncThunk(
  "treatments/update",
  async ({ id, treatment, recordedAt }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/casualties-treatment/record/${id}`, {
        treatment,
        recordedAt,
      });
      return response.data.casualtyTreatment;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update treatment",
      );
    }
  },
);

/**
 * Deletes one treatment row, addressed by its own id.
 *
 * @param {{ id: string }} params
 * @returns {Promise<Object>} The deleted treatment row.
 */
export const deleteTreatment = createAsyncThunk(
  "treatments/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.delete(`/casualties-treatment/record/${id}`);
      return response.data.casualtyTreatment;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to delete treatment",
      );
    }
  },
);

/**
 * Keyed by event id, mirroring the casualties slice — components derive a single
 * casualty's treatments by filtering on "injury-id", so there's one copy of
 * each row to keep in sync rather than two indexes to patch on every write.
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
 * Treatments slice: holds each event's `casualties-treatment` rows.
 */
const treatmentsSlice = createSlice({
  name: "treatments",
  initialState,
  reducers: {
    /** Clears a failed save so a reopened form doesn't show a stale error. */
    clearTreatmentSaveError(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTreatmentsByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTreatmentsByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.treatments;
      })
      .addCase(fetchTreatmentsByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createTreatment.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createTreatment.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = sortByRecordedAtDesc([
          ...(state.byEventId[eventId] || []),
          action.payload,
        ]);
      })
      .addCase(createTreatment.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateTreatment.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateTreatment.fulfilled, (state, action) => {
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
      .addCase(updateTreatment.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(deleteTreatment.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(deleteTreatment.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = (state.byEventId[eventId] || []).filter(
          (record) => record.id !== action.payload.id,
        );
      })
      .addCase(deleteTreatment.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      });
  },
});

export const { clearTreatmentSaveError } = treatmentsSlice.actions;

export default treatmentsSlice.reducer;