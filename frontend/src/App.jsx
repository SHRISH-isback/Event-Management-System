import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import MyEvents from "./pages/MyEvents";
import EventDetails from "./pages/EventDetails";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEvent from "./pages/CreateEvent";
import AdminDashboard from "./pages/AdminDashboard";
import EventRegistrations from "./pages/EventRegistrations";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import OrganizerProfile from "./pages/OrganizerProfile";
import Clubs from "./pages/Clubs";
import OrganizerDetail from "./pages/OrganizerDetail";
import AttendanceDashboard from "./pages/AttendanceDashboard";
import PasswordResetManagement from "./pages/PasswordResetManagement";
import MerchandiseOrders from "./pages/MerchandiseOrders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <AdminDashboard />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <OrganizerDashboard />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <CreateEvent />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Events />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/participant/events"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Events />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MyEvents />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <EventDetails />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Profile />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/profile"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <OrganizerProfile />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/event/:eventId/registrations"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <EventRegistrations />
              </>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/organizer/event/:eventId/attendance"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <AttendanceDashboard />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/merchandise-orders"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MerchandiseOrders />
              </>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/clubs"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Clubs />
              </>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/organizers/:id"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <OrganizerDetail />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/password-resets"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <PasswordResetManagement />
              </>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
