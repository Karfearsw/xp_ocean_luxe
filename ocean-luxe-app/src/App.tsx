import { Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import ResortsPage from "./pages/ResortsPage";
import ResortDetailPage from "./pages/ResortDetailPage";
import BookingFlowPage from "./pages/BookingFlowPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import PoliciesPage from "./pages/PoliciesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/resorts" element={<ResortsPage />} />
        <Route path="/resorts/:slug" element={<ResortDetailPage />} />
        <Route path="/book/:resortSlug/:packageId" element={<BookingFlowPage />} />
        <Route path="/booking/confirmed/:bookingReference" element={<BookingConfirmationPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="*" element={<Navigate to="/resorts" replace />} />
      </Route>
    </Routes>
  );
}
