import { Navigate, Route, Routes, useParams } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import AccountLoginPage from "./pages/AccountLoginPage";
import AccountMagicPage from "./pages/AccountMagicPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PoliciesPage from "./pages/PoliciesPage";
import DestinationsPage from "./pages/DestinationsPage";
import ResortPublicPage from "./pages/ResortPublicPage";
import BookMarketplacePage from "./pages/BookMarketplacePage";
import ConciergeOrlandoPage from "./pages/ConciergeOrlandoPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import Packages from "./pages/Packages";
import Partners from "./pages/Partners";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminResortsPage from "./pages/admin/AdminResortsPage";
import AdminCarsPage from "./pages/admin/AdminCarsPage";
import AdminConciergePage from "./pages/admin/AdminConciergePage";

function LegacyResortRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/resort/${encodeURIComponent(slug)}` : "/destinations"} replace />;
}

function LegacyBookRedirect() {
  const { resortSlug } = useParams();
  return <Navigate to={resortSlug ? `/book?resort=${encodeURIComponent(resortSlug)}` : "/book"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/resort/:slug" element={<ResortPublicPage />} />
        <Route path="/book" element={<BookMarketplacePage />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/concierge-orlando" element={<ConciergeOrlandoPage />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/resorts" element={<AdminResortsPage />} />
        <Route path="/admin/cars" element={<AdminCarsPage />} />
        <Route path="/admin/concierge" element={<AdminConciergePage />} />
        <Route path="/account/create" element={<CreateAccountPage />} />
        <Route path="/account/login" element={<AccountLoginPage />} />
        <Route path="/account/magic" element={<AccountMagicPage />} />
        <Route path="/account/bookings" element={<MyBookingsPage />} />

        <Route path="/resorts" element={<Navigate to="/destinations" replace />} />
        <Route path="/resorts/:slug" element={<LegacyResortRedirect />} />
        <Route path="/book/:resortSlug/:packageId" element={<LegacyBookRedirect />} />
        <Route path="/booking/confirmed/:bookingReference" element={<BookingConfirmationPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
