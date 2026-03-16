import React, { useState } from 'react';
import { Board, BoardName, Piece, Square, StarGameEngine } from '../game/StarGame';

interface StarGameBoardProps {
  engine: StarGameEngine;
  onMove: (moveCommand: string) => void;
}

export const StarGameBoard: React.FC<StarGameBoardProps> = ({ engine, onMove }) => {
  const [selectedSquare, setSelectedSquare] = useState<{ board: BoardName; square: string } | null>(null);
  const [validTargets, setValidTargets] = useState<{ board: BoardName; square: string }[]>([]);

  // Convert Map to Array for rendering
  const boards: Board[] = Array.from(engine.boards.values());

  const handleSquareClick = (board: Board, square: Square) => {
    // If a piece is already selected
    if (selectedSquare) {
      // If clicking the same piece, deselect
      if (selectedSquare.board === board.name && selectedSquare.square === square.id) {
        setSelectedSquare(null);
        setValidTargets([]);
        return;
      }

      // If clicking a valid target, execute move
      const isTarget = validTargets.some(t => t.board === board.name && t.square === square.id);
      if (isTarget) {
        const sourceBoard = engine.boards.get(selectedSquare.board);
        const sourceSq = sourceBoard?.squares.find(s => s.id === selectedSquare.square);
        const piece = sourceSq?.piece;

        if (piece) {
          const moveCommand = `I have moved my ${piece.color} ${piece.designation} piece from ${selectedSquare.board} ${selectedSquare.square} to ${board.name} ${square.id}. It is now your turn.`;
          const success = engine.movePiece(selectedSquare.board, selectedSquare.square, board.name, square.id);
          if (success) {
            onMove(moveCommand);
          }
          setSelectedSquare(null);
          setValidTargets([]);
        }
        return;
      }
    }

    // Select a piece
    if (square.piece && square.piece.color === 'White' && engine.currentPlayer === 'White') {
      setSelectedSquare({ board: board.name, square: square.id });
      // Calculate valid targets (simplified for UI, actual validation in engine)
      // For now, any empty square on any board is a valid target to demonstrate interaction
      const targets: { board: BoardName; square: string }[] = [];
      engine.boards.forEach((b) => {
        b.squares.forEach((s) => {
          if (!s.piece) {
            targets.push({ board: b.name, square: s.id });
          }
        });
      });
      setValidTargets(targets);
    }
  };

  const isBoardActive = (board: Board) => {
    // A board is active if it has pieces of the user (White), or if it contains valid targets
    const hasPlayerPieces = board.squares.some(s => s.piece?.color === 'White');
    const hasTargets = validTargets.some(t => t.board === board.name);
    return hasPlayerPieces || hasTargets;
  };

  const boardSubtitles: Record<BoardName, string> = {
    Sirius: "The Moon",
    Arcturus: "Mercury",
    Antares: "Venus",
    Mira: "The Sun - The Abyssal Nexus",
    Rigel: "Mars",
    Deneb: "Jupiter",
    Naos: "Saturn - The Star Gate"
  };

  return (
    <div className="flex flex-col gap-8 p-4 bg-zinc-950 rounded-xl border border-zinc-800 my-4 overflow-y-auto max-h-[60vh]">
      {boards.map((board) => (
        <div 
          key={board.name} 
          className={`flex flex-col gap-2 transition-opacity duration-300 ${isBoardActive(board) ? 'opacity-100' : 'opacity-50'}`}
        >
          <div className="flex items-baseline gap-2">
            <h3 className="font-serif tracking-wide text-zinc-100 text-lg uppercase">{board.name}</h3>
            <span className="text-xs text-zinc-500 font-mono uppercase">- {boardSubtitles[board.name]}</span>
            {board.name === 'Mira' && board.squares.some(s => s.piece) && (
              <span className="text-xs bg-red-950 text-red-500 px-2 py-0.5 rounded font-mono ml-auto">
                CRITICAL STATE
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded-md w-fit mx-auto">
            {board.squares.map((square) => {
              const isSelected = selectedSquare?.board === board.name && selectedSquare?.square === square.id;
              const isTarget = validTargets.some(t => t.board === board.name && t.square === square.id);
              
              return (
                <div
                  key={square.id}
                  onClick={() => handleSquareClick(board, square)}
                  className={`
                    w-12 h-12 flex items-center justify-center relative cursor-pointer transition-colors
                    ${square.color === 'black' ? 'bg-zinc-900' : 'bg-zinc-700'}
                    ${isSelected ? 'ring-2 ring-red-500 ring-inset' : ''}
                    ${isTarget ? 'ring-2 ring-zinc-400 ring-inset hover:bg-zinc-600' : ''}
                  `}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] text-zinc-500 font-mono pointer-events-none">
                    {square.id}
                  </span>
                  
                  {square.piece && (
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center shadow-md
                      ${square.piece.color === 'White' 
                        ? 'bg-zinc-200 text-zinc-900' 
                        : 'bg-zinc-950 text-zinc-200 border border-zinc-700'}
                    `}>
                      <span className="font-serif text-sm font-bold">
                        {square.piece.designation.split('(')[0]}
                      </span>
                      <span className="font-serif text-[8px] ml-0.5 opacity-80">
                        ({square.piece.designation.split('(')[1]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
