import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Packages from "@/pages/Packages";
import Book from "@/pages/Book";
import Westgate from "@/pages/Westgate";
import Partners from "@/pages/Partners";
import SiteLayout from "@/components/SiteLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/book" element={<Book />} />
          <Route path="/westgate" element={<Westgate />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="*" element={<div className="mx-auto max-w-6xl px-5 py-20">Not found.</div>} />
        </Route>
      </Routes>
    </Router>
  );
}
