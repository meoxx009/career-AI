/**
 * Safe telemetry and product analytics logging.
 *
 * Security & Privacy Contract:
 * 1. NEVER leaks raw resume text, answer bodies, or contact details into analytics.
 * 2. Strips prohibited keys (rawText, answerText, resumeText, password, facts).
 * 3. Limits payload field length to prevent document leakage.
 * 4. Silently drops on error; never throws in user path.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export const PROHIBITED_KEYS = [
  'rawText',
  'raw_text',
  'resumeText',
  'resume_text',
  'answerText',
  'answer_text',
  'facts',
  'password',
  'projectFacts',
  'cgpa',
  'aiPayload',
  'ai_payload',
  'jobDescription',
  'job_description',
  'jobText',
  'job_text',
  'prompt',
  'raw_prompt',
  'userText',
  'secret',
  'key',
  'apiKey',
  'email',
  'contactEmail',
  'contact_email',
  'profileImageUrl',
  'profile_image_url',
  'profileImageStorageKey',
  'image',
  'avatar',
  'username',
  'displayName',
];

/**
 * Sanitizes event payload by removing any sensitive, PII, or raw document content.
 */
export function sanitizeEventPayload(payload: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (PROHIBITED_KEYS.includes(key)) {
      continue;
    }

    // Do not include large strings that could be pasted user content
    if (typeof value === 'string' && value.length > 250) {
      clean[key] = '[TRUNCATED_FOR_PRIVACY]';
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      clean[key] = sanitizeEventPayload(value as Record<string, unknown>);
      continue;
    }

    clean[key] = value;
  }

  return clean;
}

/**
 * Logs a product event safely to Supabase events table or local console.
 */
export async function logProductEvent(
  eventName: string,
  userIdOrPayload?: string | null | Record<string, unknown>,
  maybePayload?: Record<string, unknown>
): Promise<void> {
  let userId: string | null = null;
  let rawPayload: Record<string, unknown> = {};

  if (typeof userIdOrPayload === 'string') {
    userId = userIdOrPayload;
    rawPayload = maybePayload || {};
  } else if (typeof userIdOrPayload === 'object' && userIdOrPayload !== null) {
    rawPayload = userIdOrPayload;
  }

  const safePayload = sanitizeEventPayload(rawPayload);

  if (supabase && isSupabaseConfigured() && userId) {
    try {
      await supabase.from('events').insert({
        user_id: userId,
        event_name: eventName,
        payload_json: safePayload,
      });
    } catch {
      // Telemetry must never crash or block the user
    }
  } else {
    console.info(`[Analytics] ${eventName}`, safePayload);
  }
}
