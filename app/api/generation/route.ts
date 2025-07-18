import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const ResponseSchema = z.object({
  PostCopy: z.string(),
  ImageCopy: z.string(),
  ImagePromptCopy: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data || typeof data !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid data" }), { status: 400 });
    }
    const prompt = `CRITICAL RULE\nStrictly use only the numbers and facts supplied in DATA and, when optimizing tone, the patterns found in TRAINING_DATA. Never invent or guess additional figures.\n\nTRAINING_DATA:\n- 20% of conversations focus on fertilizer. These discussions are where brands can connect with their audience. Ready to cultivate more leads?\n- Over 200K conversations happened last month. That's a huge opportunity for brands to join the discussion. Don't miss out!\n- Nearly 1 in 3 posts mention biking. Brands can ride this trend to greater engagement. Ready to pedal ahead?\n\nDATA:\n${data}\n\nTASK:\n1. Find one standout, positive insight in the DATA that will excite advertisers:\n   • Big absolute numbers (\"Over 200 K conversations...\")\n   • Strong share/ratio example - (\"Nearly 1 in 3 discussions...\") - PRIORITIZE THIS IN COPY\n   • Compelling growth (\"Up 45 %+ since last spring...\")\n   • Avoid low or niche percentages (< 30 %).\n\n2. Write concise, upbeat copy blocks:\n   • PostCopy – 2-3 conversational sentences (≈35-60 words) that\n     – Lead with the stat.\n     – Explain why it matters to brands.\n     – End with a light and fun CTA\n   • ImageCopy – 1 punchy headline (≤ 25 words) restating the core stat in everyday language. Example - Fertilizer dominates 20% of conversations.\n   • ImagePromptCopy – Use the following template, always keeping the camera angle, style, and text formatting the same, but adapt the subject matter (e.g., golf, biking, etc.) and setting to match the stat/context from DATA.\n     Template: The text \"[NEARLY 1 IN 2 CONVERSATIONS ARE ABOUT MOUNTAIN BIKING]\" in bold, slanted white caps, with a subtle drop shadow, centered mid-frame. The photo: Create a low-angle, ultra-wide GoPro-style action shot, photorealistic medium shot capturing the nostalgic warmth of a late 90s indie film. A cinematic close-up of the most relevant subject for the stat/context (e.g., A low-angle, ultra-wide GoPro-style action shot of a mountain-bike front tire hammering through a rocky single-track. The rider’s calves and fork legs dominate the upper third, while sharp stones, scatter­ing dust, and blurred pebbles whoosh past the lens in the foreground etc.) in a setting that matches the topic (e.g., rugged trail for biking, lush green golf course for golf). Subtle dust particles floating in air. Add film grain effect. Use a wide-aperture lens (f/1.8) to capture every detail in razor-sharp focus, while the background dissolves into a creamy bokeh. Fuji velvia film for natural film grain, a warm, slightly muted color palette that evokes an authentic action-documentary vibe. The lighting is soft, golden hour sunlight. The scene is rendered with a shallow depth of field.\n\nFor each new topic, swap out only the subject and setting to match the stat/context, but keep all other stylistic elements the same.\n\nReturn your answer as a JSON object with fields 'PostCopy', 'ImageCopy', and 'ImagePromptCopy'.`;
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ResponseSchema,
      prompt,
    });
    if (!object) {
      return new Response(JSON.stringify({ error: "AI response was not valid JSON. Please try again." }), { status: 500 });
    }
    return Response.json(object);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to generate insight." }), { status: 500 });
  }
} 