/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChatContainer } from "./components/ChatContainer";

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback if not in AI Studio environment
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      await aistudio.openSelectKey();
      setHasKey(true); // Assume success to mitigate race condition
    }
  };

  if (hasKey === null) {
    return <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-100">Loading...</div>;
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 font-sans">
        <h1 className="text-3xl font-serif mb-4">Hecate</h1>
        <p className="mb-6 text-zinc-400 max-w-md text-center">
          To generate high-quality Tarot card art using Nano Banana 2, you must select a paid Gemini API key.
          <br /><br />
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-400 underline">Billing Documentation</a>
        </p>
        <button 
          onClick={handleSelectKey}
          className="px-6 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-white rounded-md transition-colors"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return <ChatContainer />;
}
