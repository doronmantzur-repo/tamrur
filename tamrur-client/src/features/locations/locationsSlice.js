// External
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Internal
import TamrurAPI from "../../api/TamrurAPI";

/**
 * Fetches the full locations list (landing pads, hospitals, exchange
 * points). Unlike events/casualties/evacuations, this isn't scoped per event —
 * it's one global reference list.
 * @returns {Promise<Array<Object>>}
 */
export const fetchLocations = createAsyncThunk(
  "locations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await TamrurAPI.get("/locations");
      return response.data.locations;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to load locations",
      );
    }
  },
);

/** @type {{locations: Array<Object>, status: string, error: string|null}} */
const initialState = {
  locations: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Locations slice: holds the global reference list of landing pads,
 * hospitals, and exchange points.
 */
const locationsSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default locationsSlice.reducer;
