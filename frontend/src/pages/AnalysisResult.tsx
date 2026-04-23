import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Workflow,
  GitBranch,
  FileCode,
  TestTube2,
  ClipboardCopy,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  BookOpen,
  Code2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { DiagramType, AnalysisResult as AnalysisResultType, Project } from "../types";
import { apiRequest } from "../lib/api";

const storyDiagramTabs: { key: DiagramType; label: string; icon: typeof Workflow }[] = [
  { key: "architecture", label: "Architecture", icon: Layers },
  { key: "usecase", label: "Use Case", icon: GitBranch },
  { key: "sequence", label: "Sequence", icon: Workflow },
];

const codeDiagramTabs: { key: DiagramType; label: string; icon: typeof Workflow }[] = [
  { key: "controlflow", label: "Control Flow", icon: Workflow },
  { key: "class", label: "Class Diagram", icon: FileCode },
];

function DiagramViewer({
  plantUmlCode,
  imageUrl,
}: {
  plantUmlCode: string | undefined;
  imageUrl?: string | null;
}) {
  const [showCode, setShowCode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewSrc = imageUrl;

  const handleDownloadSvg = async () => {
    if (!imageUrl || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch SVG.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "diagram.svg";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("SVG download started.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to download SVG.";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  if (!previewSrc && !plantUmlCode) {
    return (
      <div className="flex items-center justify-center py-20 text-surface-400">
        <p>No diagram available for this type.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {plantUmlCode ? (
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          {showCode ? "Hide" : "Show"} PlantUML Code
          {showCode ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        ) : (
          <span className="text-sm text-surface-400">Stored diagram image (source not shown)</span>
        )}
        <div className="flex items-center gap-2">
          {plantUmlCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(plantUmlCode);
                toast.success("PlantUML code copied!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              Copy Code
            </button>
          )}
          {imageUrl && (
            <button
              onClick={handleDownloadSvg}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Downloading..." : "Download SVG"}
            </button>
          )}
        </div>
      </div>

      {showCode && plantUmlCode && (
        <pre className="mb-4 p-4 bg-surface-900 text-surface-100 rounded-xl text-sm font-mono overflow-x-auto max-h-64 scrollbar-thin">
          {plantUmlCode}
        </pre>
      )}

      <div className="bg-white rounded-xl border border-surface-200 p-6 flex items-center justify-center min-h-[400px] overflow-auto">
        {previewSrc ? (
        <img
          src={previewSrc}
          alt="UML Diagram"
          className="max-w-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML =
              '<div class="text-center py-10"><p class="text-surface-500 text-sm">Could not load diagram image.<br/>Try showing PlantUML code or refresh the page for a new signed URL.</p></div>';
          }}
        />
        ) : (
          <p className="text-surface-500 text-sm">
            Diagram image is unavailable for this result. Regenerate analysis to create a fresh SVG.
          </p>
        )}
      </div>
    </div>
  );
}

function TestCaseCard({
  test,
  index,
}: {
  test: { id: string; name: string; description: string; type: string; input: string; expected_output: string; code?: string };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-md bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-500 shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{test.name}</p>
            <p className="text-xs text-surface-500 mt-0.5 truncate">{test.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-100 pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Input</p>
              <p className="text-sm text-surface-700 bg-surface-50 rounded-lg p-3">{test.input}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Expected Output</p>
              <p className="text-sm text-surface-700 bg-surface-50 rounded-lg p-3">{test.expected_output}</p>
            </div>
          </div>
          {test.code && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Test Code</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(test.code!);
                    toast.success("Test code copied!");
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm text-surface-100 bg-surface-900 rounded-xl p-4 overflow-x-auto font-mono scrollbar-thin">
                {test.code}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalysisResult() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDiagramTab, setActiveDiagramTab] = useState<DiagramType>("architecture");
  const [activeTestTab, setActiveTestTab] = useState<"whitebox" | "blackbox">("whitebox");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [projectData, resultData] = await Promise.all([
          apiRequest<Project>(`/api/v1/projects/${id}`),
          apiRequest<AnalysisResultType>(`/api/v1/projects/${id}/result`),
        ]);
        setProject(projectData);
        setResult(resultData);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to load analysis result.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!result) return;
    setActiveDiagramTab(result.mode === "user-story" ? "architecture" : "controlflow");
  }, [result]);

  if (loading) {
    return <div className="text-surface-500">Loading analysis result...</div>;
  }

  if (error || !project || !result) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <p className="text-red-600">{error || "Analysis result not found."}</p>
        <Link to="/history" className="inline-flex mt-3 text-sm font-medium text-primary-600">
          Back to History
        </Link>
      </div>
    );
  }

  const isStoryMode = result.mode === "user-story";

  const diagramTabs = isStoryMode ? storyDiagramTabs : codeDiagramTabs;

  const getDiagramCode = (type: DiagramType) => {
    switch (type) {
      case "architecture": return result.architecture_diagram;
      case "usecase": return result.usecase_diagram;
      case "sequence": return result.sequence_diagram;
      case "controlflow": return result.controlflow_diagram;
      case "class": return result.class_diagram;
    }
  };

  const getDiagramImageUrl = (type: DiagramType): string | undefined => {
    switch (type) {
      case "architecture": return result.architecture_diagram_image_url ?? undefined;
      case "usecase": return result.usecase_diagram_image_url ?? undefined;
      case "sequence": return result.sequence_diagram_image_url ?? undefined;
      case "controlflow": return result.controlflow_diagram_image_url ?? undefined;
      case "class": return result.class_diagram_image_url ?? undefined;
    }
  };

  const diagramCount = diagramTabs.filter(
    (t) => getDiagramCode(t.key) || getDiagramImageUrl(t.key),
  ).length;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/dashboard"
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">{project.name}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isStoryMode ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
            }`}>
              {isStoryMode ? "User Story" : "Code Upload"}
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-0.5">
            {isStoryMode
              ? `Analyzed ${new Date(result.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `${project.language} · ${project.file_count} files · Analyzed ${new Date(result.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">
            {isStoryMode ? "System Summary" : "Code Summary"}
          </h2>
        </div>
        <p className="text-sm text-surface-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* Diagrams */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Workflow className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">
            {isStoryMode ? "Generated Diagrams" : "Code Diagrams"}
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl mb-6 overflow-x-auto">
          {diagramTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveDiagramTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeDiagramTab === tab.key
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <DiagramViewer
          plantUmlCode={getDiagramCode(activeDiagramTab)}
          imageUrl={getDiagramImageUrl(activeDiagramTab)}
        />
      </div>

      {/* Test Cases — only for code-upload mode */}
      {!isStoryMode && (
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TestTube2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-surface-900">Generated Test Cases</h2>
            </div>
            <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-lg">
              <button
                onClick={() => setActiveTestTab("whitebox")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTestTab === "whitebox"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                White-Box ({result.whitebox_tests.length})
              </button>
              <button
                onClick={() => setActiveTestTab("blackbox")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTestTab === "blackbox"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Black-Box ({result.blackbox_tests.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(activeTestTab === "whitebox" ? result.whitebox_tests : result.blackbox_tests).map(
              (test, index) => (
                <TestCaseCard key={test.id} test={test} index={index} />
              ),
            )}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className={`grid gap-4 mb-6 ${isStoryMode ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <Workflow className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-surface-900">{diagramCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">Diagrams</p>
        </div>
        {!isStoryMode && (
          <>
            <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                <TestTube2 className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-surface-900">{result.whitebox_tests.length}</p>
              <p className="text-xs text-surface-500 mt-0.5">White-Box Tests</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <TestTube2 className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-surface-900">{result.blackbox_tests.length}</p>
              <p className="text-xs text-surface-500 mt-0.5">Black-Box Tests</p>
            </div>
          </>
        )}
        <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xl font-bold text-surface-900">Complete</p>
          <p className="text-xs text-surface-500 mt-0.5">Status</p>
        </div>
      </div>
    </div>
  );
}
