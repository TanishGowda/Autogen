import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "../types";
import {
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Filter,
  ArrowRight,
  FolderOpen,
  Trash2,
  BookOpen,
  Code2,
} from "lucide-react";
import { apiRequest } from "../lib/api";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
          <AlertCircle className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const rows = await apiRequest<Project[]>("/api/v1/projects");
        setProjects(rows);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const filtered = useMemo(() => projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.language || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesMode = filterMode === "all" || p.mode === filterMode;
    return matchesSearch && matchesStatus && matchesMode;
  }), [projects, searchQuery, filterStatus, filterMode]);

  const handleDelete = async (projectId: string) => {
    await apiRequest(`/api/v1/projects/${projectId}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analysis History</h1>
          <p className="text-surface-500 mt-1">
            Browse and manage all your past code analyses.
          </p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          New Analysis
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or language..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-surface-200 text-surface-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="user-story">User Story</option>
            <option value="code-upload">Code Upload</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-surface-200 text-surface-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <p className="text-surface-500">Loading analyses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <FolderOpen className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700 mb-1">No analyses found</h3>
          <p className="text-sm text-surface-500">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Start your first code analysis to see results here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-surface-100 bg-surface-50 text-xs font-semibold text-surface-500 uppercase tracking-wider">
            <div className="col-span-5">Project</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-surface-100">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-surface-50 transition-colors items-center"
              >
                <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    project.mode === "user-story" ? "bg-purple-50" : "bg-emerald-50"
                  }`}>
                    {project.mode === "user-story" ? (
                      <BookOpen className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Code2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-surface-500 truncate mt-0.5">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.mode === "user-story"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {project.mode === "user-story" ? "User Story" : "Code Upload"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  {getStatusBadge(project.status)}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-surface-500">{formatDate(project.created_at)}</span>
                </div>
                <div className="sm:col-span-1 flex items-center justify-end gap-1">
                  {project.status === "completed" && (
                    <Link
                      to={`/analysis/${project.id}`}
                      className="p-2 rounded-lg hover:bg-primary-50 text-surface-400 hover:text-primary-600 transition-colors"
                      title="View Results"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
                    title="Delete"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
