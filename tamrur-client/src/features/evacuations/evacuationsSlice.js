// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches all evacuations recorded for an event.
 * @param {string} eventId
 * @returns {Promise<{eventId: string, evacuations: Array<Object>}>}
 */
export const fetchEvacuationsByEvent = createAsyncThunk(
  "evacuations/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/evacuations/${eventId}`);
      return { eventId, evacuations: response.data.evacuations };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load evacuations",
      );
    }
  },
);

/**
 * Creates a new evacuation row for an event.
 * @param {{ eventId: string, method?: string, departurePoint?: object, forceRadioSign?: string, startTime?: string, eta?: string, aerialMissionId?: string, destinationPoint?: object }} fields
 * @returns {Promise<Object>}
 */
export const createEvacuation = createAsyncThunk(
  "evacuations/create",
  async (fields, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/evacuations", fields);
      return response.data.evacuation;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create evacuation",
      );
    }
  },
);

/**
 * Updates an evacuation's fields.
 * @param {{ id: string, changes: Object }} params
 * @returns {Promise<Object>}
 */
export const updateEvacuation = createAsyncThunk(
  "evacuations/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/evacuations/${id}`, changes);
      return response.data.evacuation;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update evacuation",
      );
    }
  },
);

/**
 * Deletes an evacuation row.
 * @param {{ id: string, eventId: string }} params
 * @returns {Promise<{ id: string, eventId: string }>}
 */
export const deleteEvacuation = createAsyncThunk(
  "evacuations/delete",
  async ({ id, eventId }, { rejectWithValue }) => {
    try {
      await TamrurAPI.delete(`/evacuations/${id}`);
      return { id, eventId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to delete evacuation",
      );
    }
  },
);

/**
 * Keyed by event id, mirroring the injuries/aerialMission slices.
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
 * Evacuations slice: holds each fetched event's evacuation rows, keyed by event id.
 */
const evacuationsSlice = createSlice({
  name: "evacuations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvacuationsByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEvacuationsByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.evacuations;
      })
      .addCase(fetchEvacuationsByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createEvacuation.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(createEvacuation.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = [...(state.byEventId[eventId] || []), action.payload];
      })
      .addCase(createEvacuation.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateEvacuation.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateEvacuation.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        const evacuations = state.byEventId[action.payload["event-id"]] || [];
        const index = evacuations.findIndex((evac) => evac.id === action.payload.id);
        if (index !== -1) {
          evacuations[index] = action.payload;
        }
      })
      .addCase(updateEvacuation.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(deleteEvacuation.fulfilled, (state, action) => {
        const { id, eventId } = action.payload;
        state.byEventId[eventId] = (state.byEventId[eventId] || []).filter((evac) => evac.id !== id);
      });
  },
});

export default evacuationsSlice.reducer;
