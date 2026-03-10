import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Home from "./screens/Home";
import Sidebar from "./components/sidebar";
import UserList from "./screens/users/Screens/userlist";
import LeadsList from "./screens/leads/Screens/leadslist";
import LeadDetailScreen from "./screens/leads/Screens/leadsdetailsscreen";
import AttendanceScreen from "./screens/attendance/attendance_screen";
import UserDetailScreen from "./screens/users/Screens/userdetailsscreen";
import TaskScreen from "./screens/tasks/Screens/taskScreen";
import TemplateScreen from "./screens/template/templateScreen";
import Login from "./screens/login/login";
import ProtectedRoute from "./protectedRoute";
import PerformanceScreen from "./screens/performance/performanceScreen";
import LeadsReport from "./screens/leadReport/leadReportScreen";

// Super Admin
import SuperAdminDashboard from "./screens/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "./screens/superadmin/SuperAdminLogin";

// Admin
import AdminDashboard from "./screens/admin/AdminDashboard";
import AdminHome from "./screens/admin/AdminHome";

const Layout = () => {
  const location = useLocation();
  const noSidebarRoutes = ["/login", "/superadmin-login", "/superadmin/dashboard"];

  return (
    <div className="flex">
      {!noSidebarRoutes.includes(location.pathname) && <Sidebar />}
      <div
        className={`flex-1 p-6 ${
          !noSidebarRoutes.includes(location.pathname) ? "ml-64" : ""
        }`}
      >
        <Routes>
          {/* Public route - Single login for Admin and SuperAdmin */}
          <Route path="/login" element={<Login />} />
          
          {/* Super Admin Login - Direct access route */}
          <Route path="/superadmin-login" element={<SuperAdminLogin />} />
          
          {/* Super Admin Dashboard */}
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          
          {/* Admin Dashboard (Overview) */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Admin Home with CRM Features */}
          <Route path="/admin/home" element={<AdminHome />} />

          {/* Protected routes - These need employee login (existing) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <LeadsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-users"
            element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lead-details/:id"
            element={
              <ProtectedRoute>
                <LeadDetailScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendanceScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/userdetail/:emp_id"
            element={
              <ProtectedRoute>
                <UserDetailScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/template"
            element={
              <ProtectedRoute>
                <TemplateScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute>
                <PerformanceScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lead_report"
            element={
              <ProtectedRoute>
                <LeadsReport />
              </ProtectedRoute>
            }
          />

          {/* Redirect any unknown path to /login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;

