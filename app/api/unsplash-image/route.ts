import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createApi } from "unsplash-js";
import nodeFetch from "node-fetch";

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

async function getDifferentUnsplashImageUrl(query: string, currentImageUrl: string | null): Promise<string | null> {
  try {
    const result = await unsplash.search.getPhotos({ query, perPage: 10 });
    if (result.type === "success" && result.response.results.length > 0) {
      // Filter out the current image
      const filtered = result.response.results.filter(img => img.urls.regular !== currentImageUrl);
      if (filtered.length === 0) return null;
      // Randomly select one from the filtered list
      const randomIdx = Math.floor(Math.random() * filtered.length);
      return filtered[randomIdx].urls.regular;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchTerm, currentImageUrl, data } = await req.json();
    let query = searchTerm;
    if (!query && data) {
      // Use OpenAI to generate a search term from the data
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Given the following data, suggest a single short search term for an Unsplash image that would best visually represent this data. Only return the search term, nothing else.\n\nDATA:\n${data}`,
      });
      query = text.trim().replace(/^"|"$/g, "");
    }
    if (!query) {
      return new Response(JSON.stringify({ error: "No search term provided or generated." }), { status: 400 });
    }
    const imageUrl = await getDifferentUnsplashImageUrl(query, currentImageUrl);
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No different Unsplash image found." }), { status: 404 });
    }
    return Response.json({ imageUrl });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to fetch Unsplash image." }), { status: 500 });
  }
} 