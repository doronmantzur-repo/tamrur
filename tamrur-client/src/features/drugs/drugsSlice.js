// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches every drug administration logged across an event, newest first.
 *
 * One request per event rather than per casualty: the medic interface shows the
 * whole casualty table at once and groups these rows by `casualty_id`, matching
 * how treatments and vitals are loaded.
 *
 * @param {string} eventId
 * @returns {Promise<{eventId: string, drugs: Array<Object>}>}
 */
export const fetchDrugsByEvent = createAsyncThunk(
  "drugs/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/drugs/by-event/${eventId}`);
      return { eventId, drugs: response.data.drugs };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed to load drugs");
    }
  },
);

/**
 * Fetches one casualty's drug log.
 *
 * The medic page uses the by-event fetch above; this is here for callers that
 * only hold a casualty id.
 *
 * @param {string} casualtyId
 * @returns {Promise<Array<Object>>}
 */
export const getDrugsByCasualtyId = createAsyncThunk(
  "drugs/fetchByCasualty",
  async (casualtyId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/drugs/by-casualty/${casualtyId}`);
      return response.data.drugs;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed to load drugs");
    }
  },
);

/**
 * Records a drug administration against a casualty.
 *
 * @param {{ eventId: string, casualtyId: string, drugName: string, doseAmount: number, doseUnit: string, route: string, administeredAt: string }} params
 * @returns {Promise<Object>} The created drug row.
 */
export const insertDrug = createAsyncThunk("drugs/insert", async (params, { rejectWithValue }) => {
  try {
    const response = await TamrurAPI.post("/drugs", params);
    return response.data.drug;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? "Failed to record drug");
  }
});

/**
 * Updates one drug row, addressed by its own id.
 *
 * @param {{ id: string, ...fields }} params
 * @returns {Promise<Object>} The updated drug row.
 */
export const updateDrug = createAsyncThunk(
  "drugs/update",
  async ({ id, ...fields }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/drugs/record/${id}`, fields);
      return response.data.drug;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed to update drug record");
    }
  },
);

/**
 * Deletes one drug row.
 *
 * @param {{ id: string }} params
 * @returns {Promise<Object>} The deleted drug row.
 */
export const deleteDrug = createAsyncThunk("drugs/delete", async ({ id }, { rejectWithValue }) => {
  try {
    const response = await TamrurAPI.delete(`/drugs/record/${id}`);
    return response.data.drug;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? "Failed to delete drug record");
  }
});

/**
 * Keyed by event id, mirroring the treatments and vitals slices — components
 * derive one casualty's drugs by filtering on `casualty_id`.
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null, saveStatus: string, saveError: string|null, lastSavedAt: number|null}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  saveStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
  // Bumped on every successful write so a form can show a confirmation without
  // having to track the thunk's promise itself.
  lastSavedAt: null,
};

/** Newest first, matching the order the server returns. */
function sortByAdministeredAtDesc(records) {
  return records.sort(
    (a, b) => new Date(b.administered_at).getTime() - new Date(a.administered_at).getTime(),
  );
}

/**
 * Drugs slice: holds each event's `drugs` rows.
 */
const drugsSlice = createSlice({
  name: "drugs",
  initialState,
  reducers: {
    /** Clears a failed save so a reopened form doesn't show a stale error. */
    clearDrugSaveError(state) {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrugsByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDrugsByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.drugs;
      })
      .addCase(fetchDrugsByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(insertDrug.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(insertDrug.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.lastSavedAt = Date.now();
        const eventId = action.payload.event_id;
        state.byEventId[eventId] = sortByAdministeredAtDesc([
          ...(state.byEventId[eventId] || []),
          action.payload,
        ]);
      })
      .addCase(insertDrug.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateDrug.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateDrug.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.lastSavedAt = Date.now();
        const eventId = action.payload.event_id;
        const records = state.byEventId[eventId] || [];
        const index = records.findIndex((record) => record.id === action.payload.id);
        if (index !== -1) {
          records[index] = action.payload;
          // The edit may have moved the record in time.
          state.byEventId[eventId] = sortByAdministeredAtDesc(records);
        }
      })
      .addCase(updateDrug.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(deleteDrug.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(deleteDrug.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload.event_id;
        state.byEventId[eventId] = (state.byEventId[eventId] || []).filter(
          (record) => record.id !== action.payload.id,
        );
      })
      .addCase(deleteDrug.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      });
  },
});

export const { clearDrugSaveError } = drugsSlice.actions;

export default drugsSlice.reducer;
