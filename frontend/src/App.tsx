
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import { AppLayout } from "./components/Layout/AppLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import ProductsManagement from "./pages/admin/ProductsManagement";
import WorkflowsManagement from "./pages/admin/WorkflowsManagement";
import TasksManagement from "./pages/admin/TasksManagement";
import WorkflowTasks from "./pages/admin/WorkflowTasks";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProducts from "./pages/client/ClientProducts";
import ClientWorkflows from "./pages/client/ClientWorkflows";
import ClientUpdates from "./pages/client/ClientUpdates";
import ClientFeedback from "./pages/client/ClientFeedback";
import EmployeeSchedule from "./pages/employee/EmployeeSchedule";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
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
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* Admin Routes */}
              <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
              <Route path="admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersManagement /></ProtectedRoute>} />
              <Route path="admin/products" element={<ProtectedRoute allowedRoles={['admin']}><ProductsManagement /></ProtectedRoute>} />
              <Route path="admin/workflows" element={<ProtectedRoute allowedRoles={['admin']}><WorkflowsManagement /></ProtectedRoute>} />
              <Route path="admin/tasks" element={<ProtectedRoute allowedRoles={['admin']}><TasksManagement /></ProtectedRoute>} />
              <Route path="admin/tasks/:workflowId" element={<ProtectedRoute allowedRoles={['admin']}><WorkflowTasks /></ProtectedRoute>} />
              {/* Employee Routes */}
              <Route path="employee" element={<ProtectedRoute allowedRoles={['employee', 'admin']}><EmployeeDashboard /></ProtectedRoute>} />
              <Route path="employee/schedule" element={<ProtectedRoute allowedRoles={['employee', 'admin']}><EmployeeSchedule /></ProtectedRoute>} />
              <Route path="employee/tasks" element={<ProtectedRoute allowedRoles={['employee', 'admin']}><EmployeeTasks /></ProtectedRoute>} />
              <Route path="employee/profile" element={<ProtectedRoute allowedRoles={['employee', 'admin']}><EmployeeProfile /></ProtectedRoute>} />
              {/* Client Routes */}
              <Route path="client" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientDashboard /></ProtectedRoute>} />
              <Route path="client/products" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientProducts /></ProtectedRoute>} />
              <Route path="client/workflows" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientWorkflows /></ProtectedRoute>} />
              <Route path="client/updates" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientUpdates /></ProtectedRoute>} />
              <Route path="client/feedback" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientFeedback /></ProtectedRoute>} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  </QueryClientProvider>
);

export default App;
