import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import ServiceTracking from "./pages/ServiceTracking";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import ServiceHistoryDetails from "./pages/ServiceHistoryDetails";
import Services from "./pages/Services";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminHome from "@/pages/admin/AdminHome";
import AdminNews from "@/pages/admin/AdminNews";
import AdminClients from "./pages/admin/AdminClients";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminWorkOrders from "./pages/admin/AdminWorkOrders";
import AdminMechanics from "./pages/admin/AdminMechanics";
import AdminParts from "./pages/admin/AdminParts";
import AdminLoyalty from "./pages/admin/AdminLoyalty";
import AdminReports from "./pages/admin/AdminReports";
import AdminServices from "./pages/admin/AdminServices";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminMessenger from "./pages/admin/AdminMessenger";
import MechanicDashboard from "./pages/mechanic/MechanicDashboard";
import MechanicMessenger from "./pages/mechanic/MechanicMessenger";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Team from "./pages/Team";
import Career from "./pages/Career";
import Contacts from "./pages/Contacts";
import UsefulLinks from "./pages/UsefulLinks";
import ClientMessenger from "./pages/ClientMessenger";
import NewsDetail from "./pages/NewsDetail";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/team" element={<Team />} />
      <Route path="/career" element={<Career />} />
      <Route path="/contact" element={<Contacts />} />
      <Route path="/useful-links" element={<UsefulLinks />} />
      <Route path="/services" element={<Services />} />
      <Route path="/news/:id" element={<NewsDetail />} />
      
      {/* Защищенные маршруты */}
      <Route path="/booking" element={
        <ProtectedRoute requiredRole="client">
          <Booking />
        </ProtectedRoute>
      } />
      
      <Route path="/tracking" element={
        <ProtectedRoute>
          <ServiceTracking />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/service-history/:id" element={
        <ProtectedRoute requiredRole="client">
          <ServiceHistoryDetails />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileSettings />
        </ProtectedRoute>
      } />
      <Route path="/messenger" element={
        <ProtectedRoute requiredRole="client">
          <ClientMessenger />
        </ProtectedRoute>
      } />
      
      {/* Маршруты администратора */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      }>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="work-orders" element={<AdminWorkOrders />} />
        <Route path="mechanics" element={<AdminMechanics />} />
        <Route path="parts" element={<AdminParts />} />
        <Route path="loyalty" element={<AdminLoyalty />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="messenger" element={<AdminMessenger />} />
      </Route>
      
      {/* Маршруты для механиков */}
      <Route path="/mechanic/messenger" element={
        <ProtectedRoute requiredRole="mechanic">
          <MechanicMessenger />
        </ProtectedRoute>
      } />
      <Route path="/mechanic/*" element={
        <ProtectedRoute requiredRole="mechanic">
          <MechanicDashboard />
        </ProtectedRoute>
      } />
      
      {/* Маршрут "не найдено" */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 