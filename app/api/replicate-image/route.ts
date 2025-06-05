import { NextRequest } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid prompt" }), { status: 400 });
    }
    const options = {
      model: "google/imagen-4",
      input: {
        prompt,
        aspect_ratio: "16:9",
        safety_filter_level: "block_medium_and_above"
      }
    };
    // Create the prediction
    const prediction = await replicate.predictions.create(options);

    // Poll for completion
    let status = prediction.status;
    let output = prediction.output;
    let id = prediction.id;
    let error = prediction.error;
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 1500));
      const poll = await replicate.predictions.get(id);
      status = poll.status;
      output = poll.output;
      error = poll.error;
    }
    console.log("Replicate output:", output);
    if (
      status === "succeeded" &&
      output &&
      (
        (Array.isArray(output) && output.length > 0 && typeof output[output.length - 1] === 'string' && output[output.length - 1].startsWith('http')) ||
        (typeof output === 'string' && output.startsWith('http'))
      )
    ) {
      const url = Array.isArray(output) ? output[output.length - 1] : output;
      return Response.json({ imageUrl: url });
    } else {
      return new Response(JSON.stringify({ error: error || "Image generation failed.", rawOutput: output }), { status: 500 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to generate image from Replicate." }), { status: 500 });
  }
} 