// External
import { configureStore } from "@reduxjs/toolkit";

// Internal
import authReducer from "../features/auth/authSlice";
import eventsReducer from "../features/events/eventsSlice";
import injuriesReducer from "../features/injuries/injuriesSlice";
import treatmentsReducer from "../features/treatments/treatmentsSlice";
import vitalsReducer from "../features/vitals/vitalsSlice";
import aerialMissionReducer from "../features/aerialMission/aerialMissionSlice";
import locationsReducer from "../features/locations/locationsSlice";
import evacuationsReducer from "../features/evacuations/evacuationsSlice";
import { setTokenGetter } from "../api/TamrurAPI";

/**
 * Root Redux store. Combines all feature reducers.
 * @see features/auth/authSlice.js
 * @see features/events/eventsSlice.js
 * @see features/injuries/injuriesSlice.js
 * @see features/treatments/treatmentsSlice.js
 * @see features/vitals/vitalsSlice.js
 * @see features/aerialMission/aerialMissionSlice.js
 * @see features/locations/locationsSlice.js
 * @see features/evacuations/evacuationsSlice.js
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    injuries: injuriesReducer,
    treatments: treatmentsReducer,
    vitals: vitalsReducer,
    aerialMission: aerialMissionReducer,
    locations: locationsReducer,
    evacuations: evacuationsReducer,
  },
});

// Let TamrurAPI read the current token straight from the store, instead of
// importing the store directly (which would create a circular import back
// through authSlice.js -> TamrurAPI.js).
setTokenGetter(() => store.getState().auth.token);