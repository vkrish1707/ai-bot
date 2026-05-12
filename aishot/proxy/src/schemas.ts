import { z } from 'zod';

const MAX_IMAGE_BASE64_BYTES = 280_000; // ~200KB image after base64 inflation

export const registerBody = z.object({
  device_id: z.string().min(8).max(128),
});

export const chatMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const intent = z.object({
  subject: z.string().max(200).optional(),
  mood: z.string().max(200).optional(),
  style: z.string().max(200).optional(),
  constraints: z.string().max(500).optional(),
});

export const chatBody = z.object({
  session_id: z.string().min(1).max(128),
  messages: z.array(chatMessage).min(1).max(40),
  intent: intent.optional(),
  use_opus: z.boolean().optional(),
});

const base64Image = z
  .string()
  .min(100)
  .max(MAX_IMAGE_BASE64_BYTES)
  .refine((s) => /^[A-Za-z0-9+/=]+$/.test(s), 'invalid_base64');

export const features = z.object({
  fps: z.number().nonnegative(),
  face_count: z.number().int().nonnegative(),
  horizon_deg: z.number(),
  motion_score: z.number().min(0).max(1),
  mean_luma: z.number().min(0).max(255).optional(),
});

export const tracker = z
  .object({
    subject_id: z.string().nullable(),
    bounds: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
      .nullable(),
    confidence: z.number().min(0).max(1).nullable(),
  })
  .optional();

export const coachBody = z.object({
  session_id: z.string().min(1).max(128),
  intent: intent.optional(),
  features,
  tracker,
  image_base64: base64Image,
  last_messages: z.array(chatMessage).max(20).optional(),
});

export const critiqueBody = z.object({
  session_id: z.string().min(1).max(128),
  image_base64: base64Image,
  settings_used: z.object({
    iso: z.number(),
    shutter_seconds: z.number(),
    ev: z.number(),
    wb_kelvin: z.number(),
  }),
});

export type ChatBody = z.infer<typeof chatBody>;
export type CoachBody = z.infer<typeof coachBody>;
export type CritiqueBody = z.infer<typeof critiqueBody>;
