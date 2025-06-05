import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createApi } from "unsplash-js";
import nodeFetch from "node-fetch";

const ResponseSchema = z.object({
  Post: z.string(),
  ImageCaption: z.string(),
});

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

async function getUnsplashImageUrl(query: string): Promise<string | null> {
  try {
    const result = await unsplash.search.getPhotos({ query, perPage: 1 });
    if (result.type === "success" && result.response.results.length > 0) {
      return result.response.results[0].urls.regular;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data, imageQuery } = await req.json();
    if (!data || typeof data !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid data" }), { status: 400 });
    }
    // 1. Generate LinkedIn post and image caption
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ResponseSchema,
      prompt: data,
    });
    if (!object) {
      return new Response(JSON.stringify({ error: "AI response was not valid JSON. Please try again." }), { status: 500 });
    }
    // 2. Determine image search term
    let searchTerm = imageQuery;
    if (!searchTerm) {
      // Use OpenAI to generate a search term from the data
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Given the following data, suggest a single short search term for an Unsplash image that would best visually represent this data. Only return the search term, nothing else.\n\nDATA:\n${data}`,
      });
      searchTerm = text.trim().replace(/^"|"$/g, "");
    }
    // 3. Fetch Unsplash image
    let imageUrl: string | null = null;
    if (searchTerm) {
      imageUrl = await getUnsplashImageUrl(searchTerm);
    }
    // 4. Return all data
    return Response.json({ ...object, imageUrl });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to get response from OpenAI or Unsplash." }), { status: 500 });
  }
} 