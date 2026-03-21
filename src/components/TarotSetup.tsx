import React, { useState } from 'react';
import { DeckArchitecture, OperativeModel, TarotSessionConfig } from '../types';

interface TarotSetupProps {
  onComplete: (config: TarotSessionConfig) => void;
}

export const TarotSetup: React.FC<TarotSetupProps> = ({ onComplete }) => {
  const [deck, setDeck] = useState<DeckArchitecture>('Standard/Orthodox (Rider-Waite-Smith)');
  const [model, setModel] = useState<OperativeModel>('Psychological Mapping');

  const handleStart = () => {
    onComplete({ deckArchitecture: deck, operativeModel: model });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-100 font-sans p-6">
      <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <h2 className="text-2xl font-serif mb-6 text-center text-red-500">Establish Operative Framework</h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3 text-zinc-300">Deck Architecture</h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
              <input 
                type="radio" 
                name="deck" 
                value="Standard/Orthodox (Rider-Waite-Smith)" 
                checked={deck === 'Standard/Orthodox (Rider-Waite-Smith)'}
                onChange={(e) => setDeck(e.target.value as DeckArchitecture)}
                className="mt-1 text-red-500 focus:ring-red-500 bg-zinc-800 border-zinc-700"
              />
              <div>
                <span className="block font-medium text-zinc-200">Standard/Orthodox (Rider-Waite-Smith)</span>
                <span className="block text-sm text-zinc-500 mt-1">Traditional symbolism and structure.</span>
              </div>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
              <input 
                type="radio" 
                name="deck" 
                value="The Book of Thoth (Crowley)" 
                checked={deck === 'The Book of Thoth (Crowley)'}
                onChange={(e) => setDeck(e.target.value as DeckArchitecture)}
                className="mt-1 text-red-500 focus:ring-red-500 bg-zinc-800 border-zinc-700"
              />
              <div>
                <span className="block font-medium text-zinc-200">The Book of Thoth (Crowley)</span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Notes structural shifts: swapping of Tzaddi/He' (Emperor/Star) and renaming Justice/Strength to Adjustment/Lust.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3 text-zinc-300">Operative Model (Reading Purpose)</h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
              <input 
                type="radio" 
                name="model" 
                value="Psychological Mapping" 
                checked={model === 'Psychological Mapping'}
                onChange={(e) => setModel(e.target.value as OperativeModel)}
                className="mt-1 text-red-500 focus:ring-red-500 bg-zinc-800 border-zinc-700"
              />
              <div>
                <span className="block font-medium text-zinc-200">Psychological Mapping</span>
                <span className="block text-sm text-zinc-500 mt-1">Using cards as Gestalt coordinates for subliminal reprogramming.</span>
              </div>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
              <input 
                type="radio" 
                name="model" 
                value="Shadow Reclamation" 
                checked={model === 'Shadow Reclamation'}
                onChange={(e) => setModel(e.target.value as OperativeModel)}
                className="mt-1 text-red-500 focus:ring-red-500 bg-zinc-800 border-zinc-700"
              />
              <div>
                <span className="block font-medium text-zinc-200">Shadow Reclamation</span>
                <span className="block text-sm text-zinc-500 mt-1">Identifying and integrating repressed "negative" aspects.</span>
              </div>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
              <input 
                type="radio" 
                name="model" 
                value="Divinatory/Acausal" 
                checked={model === 'Divinatory/Acausal'}
                onChange={(e) => setModel(e.target.value as OperativeModel)}
                className="mt-1 text-red-500 focus:ring-red-500 bg-zinc-800 border-zinc-700"
              />
              <div>
                <span className="block font-medium text-zinc-200">Divinatory/Acausal</span>
                <span className="block text-sm text-zinc-500 mt-1">Traditional probability mapping.</span>
              </div>
            </label>
          </div>
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-3 bg-red-950 hover:bg-red-900 border border-red-800 text-white rounded-lg transition-colors font-medium tracking-wide uppercase text-sm"
        >
          Initialize Session
        </button>
      </div>
    </div>
  );
};
