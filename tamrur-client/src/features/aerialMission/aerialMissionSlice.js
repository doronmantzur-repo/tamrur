// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches the aerial mission request(s) for an event.
 * @param {string} eventId
 * @returns {Promise<{eventId: string, missions: Array<Object>}>}
 */
export const fetchAerialMissionsByEvent = createAsyncThunk(
  "aerialMission/fetchByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get(`/aerial-mission/${eventId}`);
      return { eventId, missions: response.data.aerialMissions };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load aerial missions",
      );
    }
  },
);

/**
 * Creates a new aerial mission request for an event that doesn't have one yet.
 * @param {{ eventId: string, requestStatus: "approved" | "denied", radioSign?: string }} params
 * @returns {Promise<Object>}
 */
export const createAerialMission = createAsyncThunk(
  "aerialMission/create",
  async ({ eventId, requestStatus, radioSign }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.post("/aerial-mission", {
        eventId,
        requestStatus,
        radioSign,
      });
      return response.data.aerialMission;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create aerial mission",
      );
    }
  },
);

/**
 * Approves or denies an existing aerial mission request (optionally setting the chopper's radio call sign).
 * @param {{ id: string, requestStatus: "approved" | "denied", radioSign?: string }} params
 * @returns {Promise<Object>}
 */
export const updateAerialMission = createAsyncThunk(
  "aerialMission/update",
  async ({ id, requestStatus, radioSign }, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.put(`/aerial-mission/${id}`, {
        requestStatus,
        radioSign,
      });
      return response.data.aerialMission;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update aerial mission",
      );
    }
  },
);

/**
 * Keyed by event id, mirroring the injuries slice — several events' mission
 * requests can be on screen at once on the airforce page.
 * @type {{byEventId: Object<string, Array<Object>>, status: string, error: string|null}}
 */
const initialState = {
  byEventId: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Aerial mission slice: holds each event's aerial evacuation mission request(s).
 */
const aerialMissionSlice = createSlice({
  name: "aerialMission",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAerialMissionsByEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAerialMissionsByEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byEventId[action.payload.eventId] = action.payload.missions;
      })
      .addCase(fetchAerialMissionsByEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createAerialMission.fulfilled, (state, action) => {
        const eventId = action.payload["event-id"];
        state.byEventId[eventId] = [...(state.byEventId[eventId] || []), action.payload];
      })
      .addCase(updateAerialMission.fulfilled, (state, action) => {
        const eventId = action.payload["event-id"];
        const missions = state.byEventId[eventId] || [];
        const index = missions.findIndex((mission) => mission.id === action.payload.id);
        if (index !== -1) {
          missions[index] = action.payload;
        }
      });
  },
});

export default aerialMissionSlice.reducer;
