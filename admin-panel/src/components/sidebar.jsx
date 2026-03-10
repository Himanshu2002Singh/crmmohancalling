import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    // Special case for Plan (/admin/home) to ensure it activates correctly
    if (path === "/admin/home") {
      return location.pathname === "/admin/home";
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "crm" },
    { path: "/admin/home", label: "Plan", icon: "home" },
    { path: "/leads", label: "Leads", icon: "document" },
    { path: "/add-users", label: "Add Employees", icon: "user-add" },
    { path: "/attendance", label: "Attendance", icon: "calendar" },
    { path: "/tasks", label: "Tasks", icon: "task" },
    { path: "/template", label: "Template", icon: "template" },
    { path: "/performance", label: "Performance Report", icon: "performance" },
    { path: "/lead_report", label: "Lead Report", icon: "lead_report" },
    { path: "/logout", label: "Logout", icon: "logout" },
  ];

  const getIcon = (icon) => {
    switch (icon) {
      case "home":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10h4m10-10v10h-4" />
          </svg>
        );
      case "crm":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case "document":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
        );
      case "user-add":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v6m3-3h-6m-3 0a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a4 4 0 014-4h4" />
          </svg>
        );
      case "calendar":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "task":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case "template":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
      case "performance":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case "lead_report":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "logout":
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Check user role and get appropriate name
  const adminName = localStorage.getItem("adminUsername") || localStorage.getItem("companyName") || localStorage.getItem("superadminUsername") || "Admin";
  const userRole = localStorage.getItem("adminRole") || localStorage.getItem("superadminRole") || "admin";
  
  const name = localStorage.getItem("name") || adminName;
  const email = localStorage.getItem("email") || (userRole === 'superadmin' ? 'superadmin@trustingbrains.com' : 'admin@company.com');

  // Handle logout
  const handleLogout = () => {
    // Clear all possible auth keys
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("companyName");
    localStorage.removeItem("superadminToken");
    localStorage.removeItem("superadminId");
    localStorage.removeItem("superadminUsername");
    localStorage.removeItem("superadminRole");
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = "/login";
  };

  return (
    <div className="bg-[#1e293b] text-white h-screen fixed top-0 left-0 w-[250px] py-6 px-4 font-[sans-serif] shadow-lg z-40 flex flex-col">
      {/* Logo Section */}
      <div className="flex-shrink-0">
        <div className="w-full flex items-center justify-center mb-8">
          <Link to="/">
            <div className="flex items-center justify-center bg-white p-2 rounded-lg">
              <div className="text-black font-bold text-lg">CALLING CRM</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Items - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <ul className="space-y-2">
          {navItems.map(({ path, label, icon }) => (
            <li key={path}>
              {path === "/logout" ? (
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center rounded-lg px-4 py-3 transition-all ${
                    isActive(path)
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`}
                >
                  {getIcon(icon)}
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ) : (
                <Link
                  to={path}
                  className={`flex items-center rounded-lg px-4 py-3 transition-all ${
                    isActive(path)
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`}
                >
                  {getIcon(icon)}
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom profile section */}
      <div className="flex-shrink-0 pt-4 border-t border-blue-800 mt-auto">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-blue-200 truncate">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;