import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardPage from "./pages/guest/DashboardPage";
import MedicPage from "./pages/medical/MedicPage";
import AerialEvacuationPage from "./pages/airforce/AerialEvacuationPage";
import EventDashboardPage from "./pages/brigade/EventDashboardPage";
import EventQueueBoardPage from "./pages/brigade/EventQueueBoardPage";
import EventAnalystPage from "./pages/event-analyst/EventAnalystPage";
import MedicQueryPage from "./pages/medic-query/MedicQueryPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medic"
        element={
          <ProtectedRoute allowedRoles={["medic"]}>
            <MedicPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/airforce"
        element={
          <ProtectedRoute allowedRoles={["airforce"]}>
            <AerialEvacuationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brigade"
        element={
          <ProtectedRoute allowedRoles={["brigade"]}>
            <EventQueueBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brigade/:eventId"
        element={
          <ProtectedRoute allowedRoles={["brigade"]}>
            <EventDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyst"
        element={
          <ProtectedRoute allowedRoles={["brigade"]}>
            <EventAnalystPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/query"
        element={
          <ProtectedRoute allowedRoles={["medic"]}>
            <MedicQueryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
