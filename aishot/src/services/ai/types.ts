export type Intent = {
  subject?: string;
  mood?: string;
  style?: string;
  constraints?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type FeatureSnapshot = {
  fps: number;
  face_count: number;
  horizon_deg: number;
  motion_score: number;
  mean_luma?: number;
};

export type TrackerSnapshot = {
  subject_id: string | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  confidence: number | null;
};

export type Budget = {
  used_usd: number;
  cap_usd: number;
  resets_at: string;
};
