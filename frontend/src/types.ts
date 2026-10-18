export interface Message {
  role: "user" | "assistant";
  content: string;
  usage?: {
    duration: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    rag_used?: boolean;
  };
}

export interface Snapshot {
  id: string | number;
  chatSummary: string;
}

export interface SearchResult {
  id: string;
  file_name: string;
  chat_summary: string;
  created_at: string;
}

export interface SearchResponse {
  summary: string;
  results: SearchResult[];
  generated_sql: string;
  error?: string;
}

export interface RagStatus {
  total_chunks: number;
  indexed_files: string[];
}

export interface RagSearchResult {
  file_name: string;
  chunk_index: number;
  similarity: number;
  code: string;
}
