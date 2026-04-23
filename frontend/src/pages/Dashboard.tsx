import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FolderClock, PlusCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Welcome, {firstName}</h1>
        <p className="text-surface-500 mt-1">Choose what you want to do next.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/analyze"
          className="bg-white border border-surface-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <PlusCircle className="w-6 h-6 text-primary-600 mb-3" />
          <h2 className="text-base font-semibold text-surface-900">New Analysis</h2>
          <p className="text-sm text-surface-500 mt-1">Start a new user story or code analysis.</p>
        </Link>

        <Link
          to="/history"
          className="bg-white border border-surface-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <FolderClock className="w-6 h-6 text-primary-600 mb-3" />
          <h2 className="text-base font-semibold text-surface-900">History</h2>
          <p className="text-sm text-surface-500 mt-1">View previous analyses and generated outputs.</p>
        </Link>
      </div>
    </div>
  );
}
