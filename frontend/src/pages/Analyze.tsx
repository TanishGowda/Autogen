import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import type { AnalysisMode } from "../types";
import { apiRequest } from "../lib/api";
import {
  Upload,
  FileCode,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  File,
  FolderUp,
  BookOpen,
  Code2,
  Workflow,
  GitBranch,
  Layers,
  TestTube2,
  FileText,
} from "lucide-react";

const SUPPORTED_EXTENSIONS = [
  ".java", ".py", ".js", ".ts", ".jsx", ".tsx", ".cpp",
  ".c", ".cs", ".rb", ".go", ".kt", ".swift", ".php",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface UploadedFile {
  file: File;
  content: string;
  language: string;
}

function detectLanguage(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".java": "Java", ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".jsx": "React JSX", ".tsx": "React TSX", ".cpp": "C++", ".c": "C",
    ".cs": "C#", ".rb": "Ruby", ".go": "Go", ".kt": "Kotlin",
    ".swift": "Swift", ".php": "PHP",
  };
  return map[ext] || "Unknown";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Analyze() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AnalysisMode | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // User Story mode
  const [userStory, setUserStory] = useState("");

  // Code Upload mode
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        toast.error(`Unsupported file type: ${file.name}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${file.name} (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setFiles((prev) => {
          if (prev.some((f) => f.file.name === file.name)) {
            toast.error(`File already added: ${file.name}`);
            return prev;
          }
          return [...prev, { file, content, language: detectLanguage(file.name) }];
        });
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.file.name !== name));
  };

  const canSubmit = () => {
    if (!projectName.trim()) return false;
    if (mode === "user-story") return userStory.trim().length >= 20;
    if (mode === "code-upload") return files.length > 0;
    return false;
  };

  const handleAnalyze = async () => {
    if (!canSubmit()) {
      if (mode === "user-story" && userStory.trim().length < 20) {
        toast.error("Please provide a more detailed description (at least 20 characters).");
      } else {
        toast.error("Please fill in all required fields.");
      }
      return;
    }

    setIsAnalyzing(true);
    try {
      let response: { project_id: string; status: string };
      if (mode === "user-story") {
        response = await apiRequest("/api/v1/projects/user-story", {
          method: "POST",
          body: JSON.stringify({
            project_name: projectName.trim(),
            description: userStory.trim(),
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("project_name", projectName.trim());
        files.forEach((f) => formData.append("files", f.file));
        response = await apiRequest("/api/v1/projects/code-upload", {
          method: "POST",
          body: formData,
        });
      }

      toast.success("Analysis complete! Redirecting to results...");
      navigate(`/analysis/${response.project_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const topLanguage = files.length > 0
    ? Object.entries(
        files.reduce((acc, f) => { acc[f.language] = (acc[f.language] || 0) + 1; return acc; }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : undefined;

  // Step 1: Mode selection
  if (!mode) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">New Analysis</h1>
          <p className="text-surface-500 mt-1">
            Choose the type of analysis you want to perform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: User Story */}
          <button
            onClick={() => setMode("user-story")}
            className="group text-left bg-white rounded-2xl border-2 border-surface-200 hover:border-primary-400 p-8 transition-all hover:shadow-lg hover:shadow-primary-100/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center mb-5 transition-colors">
              <BookOpen className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              User Story / Description
            </h2>
            <p className="text-sm text-surface-500 leading-relaxed mb-5">
              Describe your system or software idea in plain text. The AI will generate
              architectural and behavioral diagrams from your description.
            </p>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                What you'll get
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm text-surface-700">Architecture Diagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-sm text-surface-700">Use-Case Diagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-sm text-surface-700">Sequence Diagram</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-primary-600 text-sm font-semibold group-hover:gap-3 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Option B: Code Upload */}
          <button
            onClick={() => setMode("code-upload")}
            className="group text-left bg-white rounded-2xl border-2 border-surface-200 hover:border-primary-400 p-8 transition-all hover:shadow-lg hover:shadow-primary-100/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-5 transition-colors">
              <Code2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              DSA Code Upload
            </h2>
            <p className="text-sm text-surface-500 leading-relaxed mb-5">
              Upload your source code files (algorithms, data structures, etc.) and get
              control flow diagrams, class diagrams, and auto-generated test cases.
            </p>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                What you'll get
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                  <Workflow className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-sm text-surface-700">Control Flow Diagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                  <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-surface-700">Class Diagram</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center">
                  <TestTube2 className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <span className="text-sm text-surface-700">White-Box & Black-Box Test Cases</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-primary-600 text-sm font-semibold group-hover:gap-3 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Form based on selected mode
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { setMode(null); setProjectName(""); setUserStory(""); setFiles([]); }}
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {mode === "user-story" ? "User Story / Description" : "DSA Code Upload"}
          </h1>
          <p className="text-surface-500 mt-0.5">
            {mode === "user-story"
              ? "Describe your system to generate Architecture, Use-Case, and Sequence diagrams."
              : "Upload your code files to generate Control Flow diagrams, Class diagrams, and test cases."}
          </p>
        </div>
      </div>

      {/* Mode badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          mode === "user-story"
            ? "bg-purple-50 text-purple-700"
            : "bg-emerald-50 text-emerald-700"
        }`}>
          {mode === "user-story" ? (
            <><BookOpen className="w-3.5 h-3.5" /> User Story Mode</>
          ) : (
            <><Code2 className="w-3.5 h-3.5" /> Code Upload Mode</>
          )}
        </span>
        <span className="text-xs text-surface-400">
          {mode === "user-story"
            ? "Generates: Architecture Diagram, Use-Case Diagram, Sequence Diagram"
            : "Generates: Control Flow Diagram, Class Diagram, White-Box & Black-Box Tests"}
        </span>
      </div>

      {/* Project Name */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder={mode === "user-story" ? "e.g., E-Commerce Platform" : "e.g., Sorting Algorithms"}
          className="w-full px-4 py-2.5 rounded-lg border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Mode-specific input */}
      {mode === "user-story" ? (
        /* ===== USER STORY FORM ===== */
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-surface-900">System Description</h2>
          </div>
          <p className="text-sm text-surface-500 mb-4">
            Describe your system, its features, user roles, and workflows. The more detail you provide,
            the better the generated diagrams will be.
          </p>
          <textarea
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
            rows={10}
            placeholder={`Example:\n\nWe are building an online e-commerce platform where customers can browse products, add items to their cart, and place orders. The system should support user registration and login, product search with filters, a shopping cart, checkout with payment processing via Stripe, order tracking, and email notifications.\n\nAdmin users can manage the product catalog, view sales reports, and handle customer support tickets. The system should have a responsive web interface and a RESTful API backend.`}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none leading-relaxed text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-surface-400">
              {userStory.length} characters
              {userStory.length > 0 && userStory.length < 20 && (
                <span className="text-amber-500 ml-1">(minimum 20 characters)</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        /* ===== CODE UPLOAD FORM ===== */
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-surface-900">Source Code Files</h2>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary-400 bg-primary-50"
                : "border-surface-300 hover:border-primary-300 hover:bg-surface-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDragActive ? "bg-primary-100" : "bg-surface-100"
              }`}>
                {isDragActive ? (
                  <FolderUp className="w-8 h-8 text-primary-600" />
                ) : (
                  <Upload className="w-8 h-8 text-surface-400" />
                )}
              </div>
              <p className="text-base font-medium text-surface-700 mb-1">
                {isDragActive ? "Drop your files here" : "Drag & drop source code files here"}
              </p>
              <p className="text-sm text-surface-400 mb-4">or click to browse files</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[".java", ".py", ".js", ".ts", ".cpp", ".cs", ".go"].map((ext) => (
                  <span key={ext} className="px-2 py-0.5 text-xs font-mono rounded bg-surface-100 text-surface-500">
                    {ext}
                  </span>
                ))}
                <span className="text-xs text-surface-400">& more</span>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-surface-700">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                  {topLanguage && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
                      {topLanguage}
                    </span>
                  )}
                </p>
                <button onClick={() => setFiles([])} className="text-xs font-medium text-red-500 hover:text-red-600">
                  Remove All
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {files.map((f) => (
                  <div key={f.file.name} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-surface-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-white border border-surface-200 flex items-center justify-center shrink-0">
                        {f.language === "Unknown" ? (
                          <File className="w-4 h-4 text-surface-400" />
                        ) : (
                          <FileCode className="w-4 h-4 text-primary-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-800 truncate">{f.file.name}</p>
                        <p className="text-xs text-surface-400">{f.language} · {formatFileSize(f.file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(f.file.name)}
                      className="p-1 rounded hover:bg-surface-200 text-surface-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Tips for best results</p>
          <p className="text-sm text-amber-700 mt-0.5">
            {mode === "user-story"
              ? "Include details about user roles, features, workflows, and system components. Mention integrations, data flows, and any specific requirements for more accurate diagrams."
              : "Upload complete, compilable source code files. The AI will analyze class structures, method signatures, control flow logic, and relationships to generate diagrams and test cases."}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => { setMode(null); setProjectName(""); setUserStory(""); setFiles([]); }}
          className="px-5 py-2.5 text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !canSubmit()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
          ) : (
            <>
              {mode === "user-story" ? "Generate Diagrams" : "Analyze Code"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
