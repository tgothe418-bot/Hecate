import React, { useState } from 'react';
import { Spread, TarotCard } from '../types';
import { motion } from 'motion/react';

interface SpreadBoardProps {
  spread: Spread;
}

export const SpreadBoard: React.FC<SpreadBoardProps> = ({ spread }) => {
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderCard = (card: TarotCard, index: number, style: React.CSSProperties) => {
    const isRevealed = revealedCards.has(card.id) || card.isRevealed;

    return (
      <div 
        key={card.id} 
        className="absolute w-24 h-36 sm:w-32 sm:h-48 cursor-pointer group"
        style={style}
        onClick={() => toggleCard(card.id)}
      >
        <div className="relative w-full h-full transition-transform duration-700 preserve-3d" style={{ transform: isRevealed ? 'rotateY(180deg)' : '' }}>
          {/* Card Back */}
          <div className="absolute w-full h-full backface-hidden bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-lg flex items-center justify-center overflow-hidden">
            <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border border-zinc-600 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border border-zinc-600 transform rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Card Front */}
          <div className="absolute w-full h-full backface-hidden bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
            {card.base64Image ? (
              <img src={`data:image/jpeg;base64,${card.base64Image}`} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-zinc-400">
                {card.name}
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center z-10">
              <p className="text-xs font-bold text-red-500 mb-1">{card.positionName}</p>
              <p className="text-xs text-zinc-200">{card.name}</p>
              {card.elementalDignity && <p className="text-[10px] text-zinc-400 mt-2">Elem: {card.elementalDignity}</p>}
              {card.numerologicalEmanation && <p className="text-[10px] text-zinc-400">Num: {card.numerologicalEmanation}</p>}
            </div>
          </div>
        </div>
        
        {/* Position Label (visible when face down) */}
        {!isRevealed && (
          <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            {card.positionName}
          </div>
        )}
      </div>
    );
  };

  const renderShadowWorkSpread = () => {
    // 7 cards: Descending inverted pyramid
    // 1 2 3
    //  4 5
    //   6
    //   7
    const positions = [
      { left: '10%', top: '10%' }, // Mask
      { left: '50%', top: '10%', transform: 'translateX(-50%)' }, // Shadow
      { left: '90%', top: '10%', transform: 'translateX(-100%)' }, // Root
      { left: '30%', top: '40%', transform: 'translateX(-50%)' }, // Mirror
      { left: '70%', top: '40%', transform: 'translateX(-50%)' }, // Light
      { left: '50%', top: '70%', transform: 'translateX(-50%)' }, // Integration
      { left: '50%', top: '100%', transform: 'translate(-50%, -50%)' }, // Revelation
    ];

    return (
      <div className="relative w-full max-w-2xl mx-auto h-[600px] my-8">
        {spread.cards.map((card, i) => renderCard(card, i, positions[i] || { left: 0, top: 0 }))}
      </div>
    );
  };

  const renderCrossroadsSpread = () => {
    // 6 cards: Wheel/Cross
    //      3 (Maiden)
    // 1 (Sig) 2 (Cross)  6 (Path)
    //      4 (Mother)
    //      5 (Crone)
    const positions = [
      { left: '30%', top: '40%', transform: 'translate(-50%, -50%)' }, // Significator
      { left: '30%', top: '40%', transform: 'translate(-50%, -50%) rotate(90deg)' }, // Divine Intersect (Crossing)
      { left: '30%', top: '10%', transform: 'translate(-50%, 0)' }, // Maiden
      { left: '30%', top: '70%', transform: 'translate(-50%, -100%)' }, // Mother
      { left: '30%', top: '100%', transform: 'translate(-50%, -100%)' }, // Crone
      { left: '70%', top: '40%', transform: 'translate(-50%, -50%)' }, // Path Forward
    ];

    return (
      <div className="relative w-full max-w-2xl mx-auto h-[600px] my-8">
        {spread.cards.map((card, i) => renderCard(card, i, positions[i] || { left: 0, top: 0 }))}
      </div>
    );
  };

  const renderLinearSpread = () => {
    return (
      <div className="flex flex-wrap justify-center gap-6 my-8">
        {spread.cards.map((card, i) => (
          <div key={card.id} className="relative">
            {renderCard(card, i, { position: 'relative' })}
          </div>
        ))}
      </div>
    );
  };

  const renderPsychologicalWebbingSpread = () => {
    // Dynamic node-based spread. For simplicity in this static representation,
    // we'll arrange them in a branching pattern from a central node.
    // 1 (Center) -> 2 (Left), 3 (Right) -> 4 (Far Left), 5 (Far Right) etc.
    
    const positions: React.CSSProperties[] = [];
    const centerX = 50;
    const centerY = 50;
    
    spread.cards.forEach((_, i) => {
      if (i === 0) {
        positions.push({ left: `${centerX}%`, top: `${centerY}%`, transform: 'translate(-50%, -50%)', zIndex: 10 });
      } else {
        // Calculate a spiral or branching pattern
        const angle = (i * 137.5) * (Math.PI / 180); // Golden angle approximation
        const radius = 20 + (i * 5); // Increasing radius
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        positions.push({ 
          left: `${x}%`, 
          top: `${y}%`, 
          transform: 'translate(-50%, -50%)',
          zIndex: 10 - i
        });
      }
    });

    return (
      <div className="relative w-full max-w-3xl mx-auto h-[700px] my-8 border border-zinc-800/50 rounded-xl bg-zinc-950/30 overflow-hidden">
        {/* SVG lines connecting the nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          {spread.cards.map((_, i) => {
            if (i === 0) return null;
            const pos1 = positions[0]; // Connect all to center for now, or could connect sequentially
            const pos2 = positions[i];
            return (
              <line 
                key={`line-${i}`}
                x1={pos1.left} 
                y1={pos1.top} 
                x2={pos2.left} 
                y2={pos2.top} 
                stroke="#ef4444" 
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>
        {spread.cards.map((card, i) => renderCard(card, i, positions[i] || { left: 0, top: 0 }))}
      </div>
    );
  };

  if (spread.type === 'Shadow Work') return renderShadowWorkSpread();
  if (spread.type === 'Hecate\'s Crossroads') return renderCrossroadsSpread();
  if (spread.type === 'Psychological Webbing') return renderPsychologicalWebbingSpread();
  
  return renderLinearSpread();
};
