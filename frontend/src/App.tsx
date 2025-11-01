
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
// import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import { AppLayout } from "./components/Layout/AppLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Landing page route */}
            <Route path="/" element={<Index />} />
            
            {/* App Routes */}
            <Route path="/app" element={<AppLayout />}>
              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              {/* Employee Routes */}
              <Route path="employee" element={<EmployeeDashboard />} />
              {/* Client Routes */}
              <Route path="client" element={<ClientDashboard />} />

            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  </QueryClientProvider>
);

export default App;
