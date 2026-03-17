import React, { useState, useRef } from 'react';
import { StarGameEngine, SGSPiece } from '../game/StarGame';

interface StarGameBoardProps {
  engine: StarGameEngine;
  onMove: (moveCommand: string) => void;
  onSystemMessage?: (msg: string) => void;
}

export const StarGameBoard: React.FC<StarGameBoardProps> = ({ engine, onMove, onSystemMessage }) => {
  const [selectedPiece, setSelectedPiece] = useState<SGSPiece | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        engine.importSGS(content);
        setForceRender(prev => prev + 1);
        if (onSystemMessage) {
          onSystemMessage("External Aeonic geometry synchronized.");
        }
      } catch (err) {
        console.error(err);
        if (onSystemMessage) {
          onSystemMessage("Failed to synchronize Aeonic geometry: Invalid SGS format.");
        }
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSquareClick = (x: number, y: number, z: number) => {
    const clickedPiece = engine.getPieceAt(x, y, z);

    if (selectedPiece) {
      if (clickedPiece && clickedPiece.pieceId === selectedPiece.pieceId) {
        setSelectedPiece(null);
        return;
      }

      // Move
      const success = engine.movePiece(selectedPiece.pieceId, x, y, z);
      if (success) {
        const moveCommand = `I have moved my ${selectedPiece.faction} piece (${selectedPiece.pieceId}) to coordinates x:${x}, y:${y}, z:${z}. It is now your turn.`;
        onMove(moveCommand);
        setSelectedPiece(null);
        setForceRender(prev => prev + 1);
      }
    } else {
      if (clickedPiece && clickedPiece.faction === engine.state.metadata.activePlayer && engine.state.metadata.activePlayer === 'White') {
        setSelectedPiece(clickedPiece);
      }
    }
  };
  
  // Render 7 boards
  const boards = [
    { z: 7, name: "Naos", subtitle: "Saturn - The Star Gate" },
    { z: 6, name: "Deneb", subtitle: "Mercury - Air" },
    { z: 5, name: "Rigel", subtitle: "Salt - Water" },
    { z: 4, name: "Mira", subtitle: "Sun - The Central Nexus" },
    { z: 3, name: "Antares", subtitle: "Mars - Iron" },
    { z: 2, name: "Arcturus", subtitle: "Venus - Copper" },
    { z: 1, name: "Sirius", subtitle: "Moon - Silver" },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 bg-zinc-950 rounded-xl border border-zinc-800 my-4 overflow-y-auto max-h-[60vh]">
      <div className="flex justify-between items-center">
        <div className="text-zinc-300 text-sm">
          Turn: {engine.state.metadata.turn} | Active: {engine.state.metadata.activePlayer} | Phase: {engine.state.metadata.aeonicPhase}
        </div>
        <div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            id="sgs-upload"
          />
          <label 
            htmlFor="sgs-upload"
            className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-mono border border-zinc-700 transition-colors"
          >
            Load SGS Matrix
          </label>
        </div>
      </div>

      {boards.map((board) => {
        const isActive = engine.state.boardState.some(p => p.coordinates.z === board.z && p.faction === 'White') || selectedPiece;
        
        return (
          <div 
            key={board.z} 
            className={`flex flex-col gap-2 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}
          >
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif tracking-wide text-zinc-100 text-lg uppercase">{board.name}</h3>
              <span className="text-xs text-zinc-500 font-mono uppercase">- {board.subtitle} (z={board.z})</span>
            </div>
            
            <div className="grid grid-cols-9 gap-0.5 bg-zinc-800 p-1 rounded-md w-fit mx-auto">
              {Array.from({ length: 9 }).map((_, rowIdx) => {
                const y = rowIdx + 1;
                return Array.from({ length: 9 }).map((_, colIdx) => {
                  const x = colIdx + 1;
                  const isBlackSquare = (x + y) % 2 === 0;
                  const piece = engine.getPieceAt(x, y, board.z);
                  const isSelected = selectedPiece?.pieceId === piece?.pieceId;
                  
                  return (
                    <div
                      key={`${x}-${y}`}
                      onClick={() => handleSquareClick(x, y, board.z)}
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center relative cursor-pointer transition-colors
                        ${isBlackSquare ? 'bg-zinc-900' : 'bg-zinc-700'}
                        ${isSelected ? 'ring-2 ring-red-500 ring-inset' : ''}
                        hover:bg-zinc-600
                      `}
                    >
                      <span className="absolute top-0.5 left-0.5 text-[6px] text-zinc-500 font-mono pointer-events-none">
                        {x},{y}
                      </span>
                      
                      {piece && (
                        <div className={`
                          w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md
                          ${piece.faction === 'White' 
                            ? 'bg-zinc-200 text-zinc-900' 
                            : 'bg-zinc-950 text-zinc-200 border border-zinc-700'}
                        `}>
                          <span className="font-serif text-xs font-bold" title={piece.alchemicalId}>
                            {piece.alchemicalId.substring(0, 1)}
                          </span>
                          <span className="font-serif text-[6px] ml-0.5 opacity-80">
                            T{piece.permutationTier}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
