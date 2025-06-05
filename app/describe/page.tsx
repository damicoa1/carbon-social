"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";

const PROMPT_GUIDELINES = `You are creating a post on LinkedIn aimed at advertisers. Our Company is called Verticalscope.

CRITICAL RULE
► Strictly use only the numbers and facts supplied in DATA. Never invent or guess additional figures.

1. Find one standout, positive insight in the new DATA that will excite advertisers:
   • Big absolute numbers ("Over 200 K conversations…")  
   • Strong share/ratio ("Nearly 1 in 3 discussions…") - PRIORITIZE THIS IN COPY unless user specifies.
   • Compelling growth ("Up 45 % + since last spring…")  
   • Avoid low or niche percentages (< 30 %).

2.  
   • Post Copy – 2-3 conversational sentences (≈35-60 words) that  
     – Lead with the stat.  
     – Explain why it matters to brands.  
     – End with a light and fun CTA
   • Image Copy – 1 punchy headline (≤ 15 words) restating the core stat in everyday language.

STYLE GUIDELINES
- Lead with the stat; skip jargon.  
- Use active verbs (surge, soar, dominate).  
- Favor human-friendly ratios: "1 in 4", "Over half", "Nearly 3×".  
- Round big numbers to nearest whole or "K/M" form.  
- Sentence-case copy (except proper nouns).  
- No hashtags, emojis, or bullet lists.
`;

export default function DescribePage() {
  const [input, setInput] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteUrl, setShowPasteUrl] = useState(false);
  const [pasteUrlInput, setPasteUrlInput] = useState("");
  const [pasteUrlError, setPasteUrlError] = useState<string | null>(null);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setPost(null);
    setImageCaption(null);
    setImageUrl(null);
    setError(null);
    try {
      const response = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: `${PROMPT_GUIDELINES}\n\nDATA:\n${input}`,
          imageQuery: imageQuery.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to generate LinkedIn post.");
      } else {
        setPost(data.Post);
        setImageCaption(data.ImageCaption);
        setImageUrl(data.imageUrl || null);
      }
    } catch (err: any) {
      setError("Failed to generate LinkedIn post.");
    } finally {
      setLoading(false);
    }
  }

  const downloadAsImage = async () => {
    if (!cardRef.current) return;
    
    try {
      // Create canvas with explicit background and color options
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff', // Explicit white background
        logging: false, // Disable logging to avoid console errors
        scale: 3, // Even higher quality
        onclone: (clonedDoc) => {
          // Override any problematic styles in the cloned document
          const clonedCard = clonedDoc.querySelector('[data-card-ref]');
          if (clonedCard instanceof HTMLElement) {
            // Force standard colors on all elements
            clonedCard.querySelectorAll('*').forEach((el) => {
              if (el instanceof HTMLElement) {
                const styles = window.getComputedStyle(el);
                // Check for oklch colors and replace them
                ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
                  const value = styles.getPropertyValue(prop);
                  if (value && value.includes('oklch')) {
                    // Replace with fallback colors
                    if (prop === 'color') el.style.color = '#000000';
                    if (prop === 'backgroundColor') el.style.backgroundColor = '#ffffff';
                    if (prop === 'borderColor') el.style.borderColor = '#e5e7eb';
                  }
                });
              }
            });
          }
        }
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "social-card.png";
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Failed to generate image. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-black">
      <h1 className="text-2xl font-bold mb-4">LinkedIn Post Generator</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        <textarea
          className="border rounded p-2 min-h-[100px]"
          placeholder="Paste your data here..."
          value={input}
          onChange={e => setInput(e.target.value)}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Optional: Type an image topic (e.g. grass fertilizer)"
          value={imageQuery}
          onChange={e => setImageQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          {loading ? "Generating LinkedIn Post..." : "Submit"}
        </button>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
      {(post || imageCaption) && (
        <div className="flex flex-col gap-6 mt-8 w-full max-w-md">
          {/* LinkedIn Post Card */}
          <div 
            className="bg-white border rounded shadow p-4"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              borderColor: '#e5e7eb'
            }}
          >
            <div className="flex items-center gap-3 mb-2 px-2">
              <div className="w-8 h-8 relative flex items-center justify-center">
                <Image
                  src="/images/verticalscope-logo.png"
                  alt="VerticalScope Inc. Logo"
                  width={60}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: '#000000' }}>VerticalScope Inc.</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>1w • 🌎</div>
              </div>
            </div>
            <div className="whitespace-pre-line text-base mb-4 px-4" style={{ color: '#374151' }}>{post}</div>
            <div
              className="relative flex items-stretch justify-stretch overflow-hidden"
              ref={cardRef}
              data-card-ref
              style={{ width: '448px', height: '160px', overflow: 'hidden', position: 'relative' }}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={imageCaption || (isCustomImage ? "Custom image" : "Unsplash image")}
                    className="object-contain w-full h-full absolute top-0 left-0 bg-white"
                    style={{ zIndex: 0 }}
                  />
                  <div className="absolute bottom-0 left-0 w-full z-10 flex items-end justify-center">
                    <div
                      className="w-full p-2 flex justify-center"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) -5%, rgba(8,8,8,0.62) 25%, rgba(0,0,0,1) 100%)' }}
                    >
                      <span
                        className="text-white text-1xl font-bold text-center drop-shadow-md"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)', color: '#ffffff' }}
                      >
                        {imageCaption}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ backgroundColor: '#1d4ed8' }} />
                  <div className="absolute bottom-0 left-0 w-full z-10 flex items-end justify-center pb-4 px-4">
                    <div
                      className="w-full p-2 flex justify-center"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(8,8,8,1) 24%, rgba(0,0,0,1) 100%)' }}
                    >
                      <span
                        className="text-white text-2xl font-bold text-center drop-shadow-md"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)', color: '#ffffff' }}
                      >
                        {imageCaption}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Change Image Button Section */}
            {imageUrl && (
              <div className="flex flex-col items-center mt-2 gap-2">
                <div className="flex gap-2">
                  <button
                    className="rounded px-4 py-2 font-semibold disabled:opacity-50"
                    style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }}
                    onClick={async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        const response = await fetch("/api/unsplash-image", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            searchTerm: imageQuery.trim() || undefined,
                            currentImageUrl: imageUrl,
                            data: `${PROMPT_GUIDELINES}\n\nDATA:\n${input}`,
                          }),
                        });
                        const data = await response.json();
                        if (!response.ok) {
                          setError(data.error || "Failed to fetch new image.");
                        } else {
                          setImageUrl(data.imageUrl || null);
                          setIsCustomImage(false);
                        }
                      } catch (err: any) {
                        setError("Failed to fetch new image.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Changing Image..." : "Change Image"}
                  </button>
                  <button
                    className="rounded px-4 py-2 font-semibold"
                    style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }}
                    type="button"
                    onClick={() => setShowPasteUrl((v) => !v)}
                  >
                    Paste Image URL
                  </button>
                  <button
                    className="rounded px-4 py-2 font-semibold"
                    style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }}
                    type="button"
                    onClick={downloadAsImage}
                  >
                    Download as PNG
                  </button>
                </div>
                {showPasteUrl && (
                  <form
                    className="flex gap-2 mt-2 w-full"
                    onSubmit={e => {
                      e.preventDefault();
                      setPasteUrlError(null);
                      if (!pasteUrlInput.trim() || !/^https?:\/\//.test(pasteUrlInput.trim())) {
                        setPasteUrlError("Please enter a valid image URL starting with http or https.");
                        return;
                      }
                      setImageUrl(pasteUrlInput.trim());
                      setIsCustomImage(true);
                      setShowPasteUrl(false);
                    }}
                  >
                    <input
                      className="border rounded p-2 flex-1"
                      placeholder="Paste image URL..."
                      value={pasteUrlInput}
                      onChange={e => setPasteUrlInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="text-white rounded px-4 py-2 font-semibold"
                      style={{ backgroundColor: '#1d4ed8' }}
                      type="submit"
                    >
                      Use
                    </button>
                  </form>
                )}
                {pasteUrlError && <div className="text-red-500 text-sm mt-1">{pasteUrlError}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}