"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function GenerationPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [postCopy, setPostCopy] = useState<string | null>(null);
  const [imageCopy, setImageCopy] = useState<string | null>(null);
  const [imagePromptCopy, setImagePromptCopy] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const PASSWORD = "letmein"; // Change this to your desired password

  const replicatePrompt = `A hyper-realistic, cinematic close-up of a mountain bike tire carving through a rocky, muddy off-road trail in a rugged alpine setting, shot with a wide-aperture lens (f/1.8) to capture every shard of gravel and splash of mud in razor-sharp detail, while the surrounding rocks and foliage dissolve into a creamy bokeh. Exposed on high-ISO color film for a touch of fine grain and warm, natural tones that evoke an authentic action-documentary vibe. Centered over the scene, a bold, slanted white sans-serif headline reads: 'Nearly 1 in 3 New Balance mentions are about biking!' with a subtle drop-shadow to ensure legibility against the dynamic background.`;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (password === PASSWORD) {
              setAuthenticated(true);
              setPasswordError("");
            } else {
              setPasswordError("Incorrect password.");
            }
          }}
          className="flex flex-col gap-4 bg-neutral-900 p-8 rounded shadow"
        >
          <label className="text-white font-semibold">Enter password to access:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="p-2 rounded bg-neutral-800 text-white"
          />
          <button type="submit" className="bg-white text-black rounded p-2 font-bold">Enter</button>
          {passwordError && <div className="text-red-500">{passwordError}</div>}
        </form>
      </div>
    );
  }

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasGenerated(true);
    setLoading(true);
    setInsight(null);
    setError(null);
    setImageLoading(true);
    setImageError(null);
    setImageUrl(null);
    setPostCopy(null);
    setImageCopy(null);
    setImagePromptCopy(null);
    try {
      // 1. Generate the insight
      const response = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: input }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to generate insight.");
        setLoading(false);
        setImageLoading(false);
        return;
      } else {
        setPostCopy(data.PostCopy);
        setImageCopy(data.ImageCopy);
        setImagePromptCopy(data.ImagePromptCopy);
        if (data.ImagePromptCopy) {
          console.log('ImagePromptCopy:', data.ImagePromptCopy);
        }
      }
      // 2. Generate the image using the AI-generated image prompt
      if (data.ImagePromptCopy) {
        const imgResponse = await fetch("/api/replicate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: data.ImagePromptCopy }),
        });
        const imgData = await imgResponse.json();
        if (!imgResponse.ok) {
          setImageError(imgData.error || "Failed to generate image.");
        } else {
          setImageUrl(imgData.imageUrl);
        }
      }
    } catch (err: any) {
      setError("Failed to generate insight.");
      setImageError("Failed to generate image.");
    } finally {
      setLoading(false);
      setImageLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-evenly" style={{ background: 'hsl(0, 0%, 9%)', color: '#fff' }}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 max-w-xl w-full gap-8 border-r border-border" style={{ borderColor: 'hsl(0, 0%, 15%)' }}>
        <Card className="w-full p-6 rounded-none" style={{ background: 'hsl(0, 0%, 9%)', color: '#fff' }}>
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <Label htmlFor="data-input" className="text-base font-semibold">Paste your data</Label>
            <Textarea
              id="data-input"
              className="min-h-[120px]"
              placeholder="Paste your data here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full mt-2 bg-white text-black hover:bg-neutral-200"
              disabled={loading || !input.trim() || imageLoading}
            >
              {loading || imageLoading ? "Generating..." : "Generate"}
            </Button>
            {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
          </form>
        </Card>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 max-w-xl w-full gap-1">
        {hasGenerated && ((loading || imageLoading) || !postCopy || !imageUrl) && (
          <div className="flex justify-center w-full">
            <Card className="w-full max-w-lg mx-auto p-0 overflow-hidden flex flex-col rounded-none" style={{ background: 'hsl(0, 0%, 9%)', color: '#fff' }}>
              {/* Skeleton Header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                <Skeleton className="h-10 w-10 rounded-full bg-[hsl(0,0%,14.9%)]" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32 bg-[hsl(0,0%,14.9%)]" />
                  <Skeleton className="h-3 w-24 bg-[hsl(0,0%,14.9%)]" />
                </div>
              </div>
              {/* Skeleton Post Copy */}
              <div className="p-6 pt-2 pb-2 w-full">
                <Skeleton className="h-4 w-full mb-2 bg-[hsl(0,0%,14.9%)]" />
                <Skeleton className="h-4 w-3/4 mb-2 bg-[hsl(0,0%,14.9%)]" />
                <Skeleton className="h-4 w-2/3 bg-[hsl(0,0%,14.9%)]" />
              </div>
              {/* Skeleton Image */}
              <div className="w-full flex justify-center pb-6">
                <Skeleton className="h-[180px] w-full max-w-lg bg-[hsl(0,0%,14.9%)]" />
              </div>
            </Card>
          </div>
        )}
        {postCopy && imageUrl && (
          <div className="flex justify-center w-full">
            <Card className="w-full max-w-lg mx-auto p-0 overflow-hidden flex flex-col rounded-none" style={{ background: 'hsl(0, 0%, 9%)', color: '#fff' }}>
              {/* Header: Avatar and company info */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/images/verticalscope-logo.png" alt="VerticalScope Inc. Logo" />
                  <AvatarFallback>VS</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-base leading-tight">Verticalscope Inc.</span>
                  <span className="text-xs text-gray-400 mt-0.5">16,266 followers<br />1w •</span>
                </div>
              </div>
              {postCopy && (
                <div className="p-6 pt-2 pb-2 w-full text-left" style={{ fontSize: '16px', lineHeight: 'normal' }}>{postCopy}</div>
              )}
              {imageError && <div className="text-red-500 text-center">{imageError}</div>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Generated visual insight"
                  className="w-full rounded border-0 mx-auto"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 