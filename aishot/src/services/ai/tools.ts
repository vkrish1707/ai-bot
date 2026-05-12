export type AdjustCameraInput = {
  iso?: number;
  shutter_seconds?: number;
  ev?: number;
  wb_kelvin?: number;
  focus_point?: { x: number; y: number };
};

export type LockSubjectInput = { description: string };
export type SayInput = { text: string; urgency?: 'low' | 'normal' | 'high' };
export type ReframeHintInput = {
  direction: 'left' | 'right' | 'up' | 'down' | 'closer' | 'back' | 'tilt_left' | 'tilt_right';
  magnitude?: 'nudge' | 'half_step' | 'full_step';
};
export type ShootNowInput = { reason?: string };
export type WaitInput = { reason: string };

export type CoachToolCall =
  | { name: 'adjust_camera'; input: AdjustCameraInput }
  | { name: 'lock_subject'; input: LockSubjectInput }
  | { name: 'say'; input: SayInput }
  | { name: 'reframe_hint'; input: ReframeHintInput }
  | { name: 'shoot_now'; input: ShootNowInput }
  | { name: 'wait'; input: WaitInput };
