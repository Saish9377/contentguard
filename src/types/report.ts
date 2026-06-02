import { FullAnalysisResult } from './analysis';

export interface Report {
  id: string;
  createdAt: string;
  fileName?: string;
  textPreview: string;
  analysis: FullAnalysisResult;
}
