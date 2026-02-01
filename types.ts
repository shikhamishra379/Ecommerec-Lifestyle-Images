export type AssetType = 'Lifestyle' | 'Infographic';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5';

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface LifestyleConcept {
  id: string;
  category: string; 
  title: string;
  description: string;
  prompt: string;
}

export interface ProductInfo {
  name: string;
  url: string;
  productImageBase64: string | null;
  theme: string; 
  assetType: AssetType;
  aspectRatio: AspectRatio;
  specificDetails: string; 
}

export interface GenerationResult {
  concepts: LifestyleConcept[];
  groundingSources?: GroundingSource[];
}
