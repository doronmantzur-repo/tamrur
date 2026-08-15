import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardPage from "./pages/guest/DashboardPage";
import MedicPage from "./pages/medical/MedicPage";
import AerialEvacuationPage from "./pages/airforce/AerialEvacuationPage";
import CreateEventForm from "./components/events/CreateEventForm";
import EventDashboardPage from "./pages/brigade/EventDashboardPage";
import EventAnalystPage from "./pages/event-analyst/EventAnalystPage";
import MedicQueryPage from "./pages/medic-query/MedicQueryPage";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/create-event" element={<CreateEventForm />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/medic" element={<MedicPage />} />
      <Route path="/airforce" element={<AerialEvacuationPage />} />
      <Route path="/brigade/:eventId" element={<EventDashboardPage />} />
      <Route path="/analyst" element={<EventAnalystPage />} />
      <Route path="/query" element={<MedicQueryPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
