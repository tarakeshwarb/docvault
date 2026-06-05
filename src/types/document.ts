export type DocumentRecord = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  uploaded_at: string;
  pdf_url: string;
  file_name: string | null;
  file_size: number | null;
};

export type NewDocument = {
  title: string;
  description?: string | null;
  category?: string | null;
  pdf_url: string;
  file_name?: string | null;
  file_size?: number | null;
};

export type DashboardStats = {
  total: number;
  categories: number;
  latestUpload: string | null;
};

export type SearchState = {
  query: string;
  results: DocumentRecord[];
  error?: string;
};

export type UploadState = {
  ok: boolean;
  message: string;
  error?: string;
};
