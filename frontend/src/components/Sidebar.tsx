import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Code2,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-surface-900 text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-surface-700/50">
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold truncate">
              Auto<span className="text-primary-400">Gen</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-600/20 text-primary-400"
                  : "text-surface-400 hover:bg-surface-700/50 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-700/50">
        {user && (
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-semibold shrink-0">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-surface-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={signOut}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-surface-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
