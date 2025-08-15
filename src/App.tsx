import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Shared components
import AppSelector from "./pages/AppSelector";
import NotFound from "./pages/NotFound";

// Car Guard App
import CarGuardApp from "./pages/car-guard/CarGuardApp";
import CarGuardLogin from "./pages/car-guard/CarGuardLogin";
import CarGuardDashboard from "./pages/car-guard/CarGuardDashboard";
import CarGuardHistory from "./pages/car-guard/CarGuardHistory";
import CarGuardPayouts from "./pages/car-guard/CarGuardPayouts";
import CarGuardProfile from "./pages/car-guard/CarGuardProfile";

// Customer Portal
import CustomerPortal from "./pages/customer/CustomerPortal";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerTipping from "./pages/customer/CustomerTipping";
import CustomerHistory from "./pages/customer/CustomerHistory";
import CustomerProfile from "./pages/customer/CustomerProfile";

// Admin Application
import AdminApp from "./pages/admin/AdminApp";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGuards from "./pages/admin/AdminGuards";
import AdminManagers from "./pages/admin/AdminManagers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminAdministration from "./pages/admin/AdminAdministration";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSaaS from "./pages/admin/AdminSaaS";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* App Selection Landing Page */}
          <Route path="/" element={<AppSelector />} />
          
          {/* Car Guard App Routes */}
          <Route path="/car-guard" element={<CarGuardApp />}>
            <Route index element={<CarGuardLogin />} />
            <Route path="dashboard" element={<CarGuardDashboard />} />
            <Route path="history" element={<CarGuardHistory />} />
            <Route path="payouts" element={<CarGuardPayouts />} />
            <Route path="profile" element={<CarGuardProfile />} />
          </Route>
          
          {/* Customer Portal Routes */}
          <Route path="/customer" element={<CustomerPortal />}>
            <Route index element={<CustomerLogin />} />
            <Route path="register" element={<CustomerRegister />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="tip/:guardId" element={<CustomerTipping />} />
            <Route path="history" element={<CustomerHistory />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
          
          {/* Admin Application Routes */}
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<AdminLogin />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="managers" element={<AdminManagers />} />
            <Route path="guards" element={<AdminGuards />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="administration" element={<AdminAdministration />}>
              <Route path="roles" element={<AdminRoles />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="saas" element={<AdminSaaS />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route index element={<AdminRoles />} />
            </Route>
          </Route>
          
          {/* Catch-all for undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
