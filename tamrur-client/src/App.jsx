import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardPage from "./pages/guest/DashboardPage";
import AerialEvacuationPage from "./pages/airforce/AerialEvacuationPage";
import CreateEventForm from "./components/events/CreateEventForm";
import EventDashboardPage from "./pages/brigade/EventDashboardPage";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/create-event" element={<CreateEventForm />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/airforce" element={<AerialEvacuationPage />} />
      <Route path="/brigade" element={<EventDashboardPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
