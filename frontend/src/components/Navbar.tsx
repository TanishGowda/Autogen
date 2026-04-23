import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Code2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = location.pathname === "/";

  if (!isLanding && user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">
              Auto<span className="text-primary-600">Gen</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">
              How It Works
            </a>
            <a href="#use-cases" className="text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors">
              Use Cases
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-surface-600"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-surface-600 py-2">
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-surface-600 py-2">
              How It Works
            </a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-primary-600 py-2">
                  Dashboard
                </Link>
                <button onClick={signOut} className="block text-sm font-medium text-red-600 py-2">
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
