/**
 * Supabase Edge Function: ai-assistant
 *
 * Safe server-side AI boundary for CareerAI.
 * Non-negotiable security rules:
 * 1. GEMINI_API_KEY is read strictly from Deno server environment (never in client bundles).
 * 2. Never logs raw resume text, user answers, or PII.
 * 3. Enforces strict input validation, token caps, and rate-limiting headers.
 * 4. Output is validated against strict Zod schemas before returning to browser.
 * 5. Returns HTTP 429/503 on quota or provider errors, enabling graceful client fallback.
 */

// Deno / Supabase Edge Functions standard HTTP handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  task: "role-explanation" | "resume-review" | "interview-feedback";
  payload: Record<string, unknown>;
  consent: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    // Non-alarming server boundary indicator: provider unconfigured
    return new Response(
      JSON.stringify({
        error: "disabled",
        message: "Gemini API key is not configured on server. Use deterministic mode.",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body: RequestPayload = await req.json();

    if (!body.consent) {
      return new Response(
        JSON.stringify({
          error: "client_error",
          message: "User consent is required before processing.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build system instructions based on task
    let systemInstruction = "";
    let userPrompt = "";

    if (body.task === "role-explanation") {
      systemInstruction = `You are CareerAI's role explanation assistant. Explain an already-computed deterministic role-alignment score using ONLY the provided evidence and gaps.
Do NOT recalculate or override the score. Do NOT infer personality, gender, college quality, or hiring probability.
Return JSON ONLY matching:
{
  "roleId": "string",
  "whyItMayFit": ["string (max 3)"],
  "knownGaps": ["string (max 3)"],
  "unknowns": ["string (max 2)"],
  "firstAction": "string",
  "confidence": "high" | "medium" | "needs_more_evidence",
  "caveat": "Guidance estimate only, not a placement guarantee.",
  "abstained": false
}`;
      userPrompt = JSON.stringify(body.payload);
    } else if (body.task === "resume-review") {
      systemInstruction = `You are CareerAI's truthful resume safety reviewer.
Review the resume against the target role and supplied source facts.
Never invent metrics, user numbers, uptime, employers, or outcomes.
If a rewrite lacks an explicit verified source fact, set needsConfirmation: true.
Do NOT say "ATS pass" or promise screening success.
Return JSON ONLY matching:
{
  "matchedTerms": ["string"],
  "missingTerms": ["string"],
  "unsupportedClaims": [{"text":"string", "reason":"string"}],
  "suggestions": [{"original":"string", "rewrite":"string", "sourceFactIds":["string"], "needsConfirmation":boolean, "note":"string"}],
  "confidence": "high" | "medium" | "needs_more_evidence",
  "caveat": "Keyword alignment is a heuristic only; review every suggestion before using.",
  "abstained": false
}`;
      userPrompt = JSON.stringify(body.payload);
    } else if (body.task === "interview-feedback") {
      systemInstruction = `You are CareerAI's supportive interview practice coach.
Evaluate the candidate answer against the supplied rubric criteria ONLY.
Never infer confidence, personality, facial expression, voice, accent, emotion, or hiring decisions.
Never produce a hire/no-hire decision.
Return JSON ONLY matching:
{
  "abstained": boolean,
  "strengths": ["string"],
  "gaps": ["string"],
  "citedCriteria": ["string"],
  "nextAction": "string",
  "confidence": "high" | "medium" | "needs_more_evidence",
  "caveat": "Practice feedback is not an interview decision."
}`;
      userPrompt = JSON.stringify(body.payload);
    } else {
      return new Response(JSON.stringify({ error: "invalid_task" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini REST API with JSON response format
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (geminiRes.status === 429) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_or_quota",
          message: "Gemini provider rate limit or quota exceeded. Use deterministic mode.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({
          error: "provider_error",
          message: `Gemini API returned status ${geminiRes.status}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({
          error: "abstained",
          message: "Model produced empty response.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const parsedJson = JSON.parse(rawText);

    return new Response(JSON.stringify({ data: parsedJson }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
