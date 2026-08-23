import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
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
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { APP_NAME, APP_SUBTITLE } from "./constants/branding";
import { ROLE_LABELS } from "./constants/roles";

const App = () => {
  // Before login (or once logged out) the tab shows the tagline, same as
  // index.html's static <title>; once a role is known, the tab names it
  // instead, so a user juggling multiple roles/tabs can tell them apart.
  const role = useSelector((state) => state.auth.user?.role);
  useDocumentTitle(role ? `${APP_NAME} — ${ROLE_LABELS[role] ?? role}` : `${APP_NAME} — ${APP_SUBTITLE}`);

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
