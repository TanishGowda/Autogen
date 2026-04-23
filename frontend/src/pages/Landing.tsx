import { Link } from "react-router-dom";
import {
  Code2,
  FileCode,
  TestTube2,
  GitBranch,
  Workflow,
  Upload,
  Cpu,
  Eye,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  BookOpen,
  Layers,
} from "lucide-react";
import Navbar from "../components/Navbar";

const features = [
  {
    icon: Layers,
    title: "Architecture Diagrams",
    description:
      "Generate system architecture diagrams showing component relationships, layers, and data flow from your system descriptions.",
  },
  {
    icon: GitBranch,
    title: "Use-Case Diagrams",
    description:
      "Extract actor interactions and system functionalities to produce comprehensive UML use-case diagrams from user stories.",
  },
  {
    icon: Workflow,
    title: "Control Flow Diagrams",
    description:
      "Visualize the execution flow of your algorithms and code logic with auto-generated control flow graphs.",
  },
  {
    icon: FileCode,
    title: "Class Diagrams",
    description:
      "Visualize class hierarchies, attributes, methods, and relationships from uploaded DSA code files.",
  },
  {
    icon: TestTube2,
    title: "Test Case Generation",
    description:
      "Generate both white-box (code logic-based) and black-box (behavior-based) test cases from your code automatically.",
  },
  {
    icon: Workflow,
    title: "Sequence Diagrams",
    description:
      "Generate sequence diagrams that capture interactions between actors, services, and components from your user stories.",
  },
];

const steps = [
  {
    step: "01",
    icon: BookOpen,
    title: "Describe or Upload",
    description:
      "Write a system description for architecture diagrams, or upload DSA code files for flow diagrams and test cases.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes Input",
    description:
      "Our LLM engine processes your input, identifying structures, actors, relationships, and logic flows.",
  },
  {
    step: "03",
    icon: Eye,
    title: "View Artifacts",
    description:
      "Browse generated diagrams, test cases, and summaries — all rendered beautifully in the browser.",
  },
];

const useCases = [
  {
    icon: Code2,
    role: "Developers",
    description: "Understand legacy codebases quickly without reading every line. Get instant architecture overviews and documentation.",
  },
  {
    icon: TestTube2,
    role: "Testers / QA",
    description: "Auto-generate comprehensive test cases covering both internal logic and external behavior.",
  },
  {
    icon: Users,
    role: "Students & Educators",
    description: "Learn software design patterns and UML modeling by seeing real diagrams generated from actual code.",
  },
  {
    icon: Workflow,
    role: "Project Managers",
    description: "Get high-level architecture views and documentation to support decision-making and onboarding.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-primary-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Reverse Engineering
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-surface-900 tracking-tight leading-tight">
              From Code to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                Complete Documentation
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed">
              Describe your system or upload code — let AI generate architecture diagrams,
              control flow graphs, class diagrams, and test cases in seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                Start Analyzing
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-surface-700 bg-white hover:bg-surface-50 rounded-xl border border-surface-200 transition-all"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free to use
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Supports Java, Python & more
              </div>
            </div>
          </div>

          {/* Hero visual — two analysis modes */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-200/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-100 bg-surface-50/50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-surface-400 font-mono">AutoGen — Two Analysis Modes</span>
              </div>
              <div className="divide-y divide-surface-100">
                {/* Mode A */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">User Story / Description</span>
                    <span className="text-xs text-surface-400 ml-1">— Describe your system in plain text and get high-level diagrams</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Architecture Diagram", color: "bg-blue-100 text-blue-700" },
                      { label: "Use-Case Diagram", color: "bg-purple-100 text-purple-700" },
                      { label: "Sequence Diagram", color: "bg-indigo-100 text-indigo-700" },
                      { label: "System Summary", color: "bg-cyan-100 text-cyan-700" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-surface-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.color}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mode B */}
                <div className="p-6 bg-surface-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">DSA Code Upload</span>
                    <span className="text-xs text-surface-400 ml-1">— Upload code files for detailed diagrams and test cases</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Control Flow Diagram", color: "bg-amber-100 text-amber-700" },
                      { label: "Class Diagram", color: "bg-emerald-100 text-emerald-700" },
                      { label: "White-Box Tests", color: "bg-rose-100 text-rose-700" },
                      { label: "Black-Box Tests", color: "bg-orange-100 text-orange-700" },
                      { label: "Code Summary", color: "bg-cyan-100 text-cyan-700" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-surface-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.color}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
              Everything You Need for Code Analysis
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              AutoGen provides a comprehensive suite of AI-powered tools to reverse-engineer
              and document your software systems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-white rounded-2xl border border-surface-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-5 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              Three simple steps to go from raw code to complete documentation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary-50" />
                    <div className="absolute inset-3 rounded-full bg-primary-100 flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-primary-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-surface-500 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
              Built for Everyone
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              Whether you're a developer, tester, student, or manager — AutoGen has something for you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc) => (
              <div
                key={uc.role}
                className="p-6 bg-white rounded-2xl border border-surface-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <uc.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">{uc.role}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Analyze Your Code?
          </h2>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            Start generating diagrams and test cases from your source code in minutes.
            Sign up for free and experience AI-powered reverse engineering.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-primary-700 bg-white hover:bg-primary-50 rounded-xl transition-all shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Auto<span className="text-primary-400">Gen</span>
              </span>
            </div>
            <p className="text-sm text-surface-400">
              &copy; {new Date().getFullYear()} AutoGen. An LLM-Powered Framework for Generating Software Artifacts.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
