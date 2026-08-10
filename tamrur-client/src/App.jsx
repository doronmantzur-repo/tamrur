import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
