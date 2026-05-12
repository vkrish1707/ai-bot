export const COACH_TOOLS = [
  {
    name: 'adjust_camera',
    description:
      'Change one or more manual camera settings. Only include fields you want to change. ' +
      'Use sparingly — every call is a visible animation the user sees.',
    input_schema: {
      type: 'object',
      properties: {
        iso: { type: 'number', description: 'Target ISO sensitivity, e.g. 100..6400' },
        shutter_seconds: {
          type: 'number',
          description: 'Shutter speed in seconds, e.g. 0.004 for 1/250s',
        },
        ev: {
          type: 'number',
          description: 'Exposure compensation in stops, range -3..+3',
        },
        wb_kelvin: {
          type: 'number',
          description: 'White balance color temperature in Kelvin, e.g. 5500',
        },
        focus_point: {
          type: 'object',
          description: 'Tap-to-focus point in normalized 0..1 frame coords',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: ['x', 'y'],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'lock_subject',
    description:
      'Tell the on-device tracker which subject to follow. Use a short visual description.',
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Short subject description, e.g. "the dog", "the kid in the red shirt"',
        },
      },
      required: ['description'],
      additionalProperties: false,
    },
  },
  {
    name: 'say',
    description: 'Speak a very short line to the user. Maximum 8 words. Used sparingly.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Spoken line, ≤ 8 words' },
        urgency: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          description: 'low = ambient, normal = guidance, high = act now',
        },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'reframe_hint',
    description: 'Tell the user how to recompose the shot.',
    input_schema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['left', 'right', 'up', 'down', 'closer', 'back', 'tilt_left', 'tilt_right'],
        },
        magnitude: {
          type: 'string',
          enum: ['nudge', 'half_step', 'full_step'],
        },
      },
      required: ['direction'],
      additionalProperties: false,
    },
  },
  {
    name: 'shoot_now',
    description:
      'Fire the shutter. The app will show a 600ms abort ring before capture. ' +
      'Only call when subject + exposure + composition are all good.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'One-line reason (logged, not spoken)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'wait',
    description: 'Defer shooting. Surfaces the reason on the adjustment ticker.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why we are waiting' },
      },
      required: ['reason'],
      additionalProperties: false,
    },
  },
] as const;

export const EXTRACT_INTENT_TOOL = {
  name: 'set_intent',
  description:
    'Set the structured shooting intent for the session, distilled from what the user said. ' +
    'Fill only fields the user actually expressed; leave others undefined. ' +
    "Also include a short spoken acknowledgement in 'reply' (≤ 8 words).",
  input_schema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'What is being photographed, e.g. "my dog", "the bridge"',
      },
      mood: {
        type: 'string',
        description: 'The emotional tone, e.g. "moody", "bright", "candid"',
      },
      style: {
        type: 'string',
        description: 'Aesthetic, e.g. "film", "documentary", "portrait"',
      },
      constraints: {
        type: 'string',
        description: 'Hard constraints, e.g. "handheld, low light, no flash"',
      },
      reply: {
        type: 'string',
        description: 'Short spoken confirmation, ≤ 8 words',
      },
    },
    required: ['reply'],
    additionalProperties: false,
  },
} as const;
