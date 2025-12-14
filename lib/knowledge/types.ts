/**
 * ChatTC Knowledge System — Type Definitions
 */

export type KnowledgeCategory = 
  | 'platform'      // tCredex platform docs, WPs, specs
  | 'nmtc'          // New Markets Tax Credit
  | 'htc'           // Historic Tax Credit
  | 'lihtc'         // Low-Income Housing Tax Credit
  | 'oz'            // Opportunity Zones
  | 'state'         // State-specific credits
  | 'compliance'    // General compliance guidance
  | 'general';      // General tax credit info

export interface DocumentMetadata {
  id: string;
  filename: string;
  category: KnowledgeCategory;
  program?: string;
  title?: string;
  source?: string;
  pageCount?: number;
  uploadedAt: string;
  uploadedBy?: string;
  checksum?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    category: KnowledgeCategory;
    program?: string;
    filename: string;
    page?: number;
    section?: string;
    chunkIndex: number;
  };
  createdAt: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document?: DocumentMetadata;
}

export interface KnowledgeSearchParams {
  query: string;
  categories?: KnowledgeCategory[];
  programs?: string[];
  limit?: number;
  minScore?: number;
}

export interface IngestResult {
  documentId: string;
  filename: string;
  chunksCreated: number;
  status: 'success' | 'error';
  error?: string;
}

// RAG context for chat
export interface RAGContext {
  chunks: SearchResult[];
  systemPromptAddition: string;
  citations: Citation[];
}

export interface Citation {
  id: string;
  source: string;
  page?: number;
  text: string;
}
