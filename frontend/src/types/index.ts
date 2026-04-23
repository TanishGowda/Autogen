export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export type AnalysisMode = "user-story" | "code-upload";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  mode: AnalysisMode;
  language?: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_count?: number;
}

export interface AnalysisResult {
  id: string;
  project_id: string;
  mode: AnalysisMode;
  architecture_diagram?: string;
  usecase_diagram?: string;
  sequence_diagram?: string;
  controlflow_diagram?: string;
  class_diagram?: string;
  /** Signed URLs from backend (Supabase Storage); refresh page to get new URLs if expired */
  architecture_diagram_image_url?: string | null;
  usecase_diagram_image_url?: string | null;
  sequence_diagram_image_url?: string | null;
  controlflow_diagram_image_url?: string | null;
  class_diagram_image_url?: string | null;
  whitebox_tests: TestCase[];
  blackbox_tests: TestCase[];
  summary: string;
  created_at: string;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: "whitebox" | "blackbox";
  input: string;
  expected_output: string;
  code?: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  content: string;
  language: string;
}

export type StoryDiagramType = "architecture" | "usecase" | "sequence";
export type CodeDiagramType = "controlflow" | "class";
export type DiagramType = StoryDiagramType | CodeDiagramType;
