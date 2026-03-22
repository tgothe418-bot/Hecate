import React, { useState } from 'react';
import { Spread, TarotCard } from '../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface SpreadBoardProps {
  spread: Spread;
}

export const SpreadBoard: React.FC<SpreadBoardProps> = ({ spread }) => {
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      if (!next.has(id)) {
        next.add(id);
      }
      return next;
    });
    setFocusedCardId(id);
  };

  const closeFocusedCard = () => {
    setFocusedCardId(null);
  };

  const getElementalGlow = (dignity?: string) => {
    if (!dignity) return '';
    const lower = dignity.toLowerCase();
    if (lower.includes('fire')) return 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.4))';
    if (lower.includes('water')) return 'drop-shadow(0 0 15px rgba(20, 184, 166, 0.4))';
    if (lower.includes('earth')) return 'drop-shadow(0 0 15px rgba(202, 138, 4, 0.4))';
    if (lower.includes('air')) return 'drop-shadow(0 0 15px rgba(250, 250, 249, 0.4))';
    return '';
  };

  const renderCard = (card: TarotCard, index: number, containerClassName: string, style?: React.CSSProperties) => {
    const isRevealed = revealedCards.has(card.id) || card.isRevealed;
    const glow = getElementalGlow(card.elementalDignity);

    return (
      <motion.div 
        layoutId={`card-${card.id}`}
        key={card.id} 
        className={containerClassName}
        style={style}
        onClick={() => toggleCard(card.id)}
      >
        <div className="relative w-full h-full transition-transform duration-700 preserve-3d" style={{ transform: isRevealed ? 'rotateY(180deg)' : '' }}>
          {/* Card Back */}
          <div className="absolute w-full h-full backface-hidden bg-zinc-800 rounded-lg shadow-lg flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
            
            {!card.base64Image && (
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <svg className="w-16 h-16 text-red-500/50" viewBox="0 0 100 100">
                  <polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <polygon points="50,90 90,10 10,10" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </motion.div>
            )}

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-12 h-12 border border-zinc-600 rounded-full flex items-center justify-center bg-zinc-900/50">
                <div className="absolute w-8 h-8 border border-zinc-600 transform rotate-45"></div>
                <span className="relative z-10 text-zinc-300 font-serif text-xl">{index + 1}</span>
              </div>
            </div>
          </div>

          {/* Card Front */}
          <div 
            className="absolute w-full h-full backface-hidden bg-zinc-900 rounded-lg shadow-xl overflow-hidden" 
            style={{ 
              transform: 'rotateY(180deg)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
              filter: isRevealed && glow ? glow : 'none'
            }}
          >
            {card.base64Image ? (
              <img src={`data:image/jpeg;base64,${card.base64Image}`} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-zinc-400">
                {card.name}
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center z-10">
              <p className="text-xs font-bold text-red-500 mb-1">{index + 1}. {card.positionName}</p>
              <p className="text-xs text-zinc-200">{card.name}</p>
            </div>
          </div>
        </div>
        
        {/* Position Label (visible when face down) */}
        {!isRevealed && (
          <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            <span className="text-red-500/80 mr-1">{index + 1}.</span> {card.positionName}
          </div>
        )}
      </motion.div>
    );
  };

  const renderCarouselSpread = (positions: React.CSSProperties[], svgLines?: React.ReactNode) => {
    return (
      <div className="w-full max-w-6xl mx-auto my-8 flex flex-col items-center">
        {/* Minimap */}
        <div className="relative w-full max-w-sm h-64 mb-12 border border-zinc-800/50 rounded-xl bg-zinc-950/30 overflow-hidden">
          {svgLines && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              {svgLines}
            </svg>
          )}
          {spread.cards.map((card, i) => (
            <div 
              key={`mini-${card.id}`} 
              className={`absolute w-6 h-8 rounded-sm border ${revealedCards.has(card.id) || card.isRevealed ? 'bg-red-900/80 border-red-500/50' : 'bg-zinc-800 border-zinc-600'} shadow-sm flex items-center justify-center`} 
              style={positions[i] || { left: 0, top: 0 }}
            >
              <span className="text-[8px] text-zinc-400">{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Carousel */}
        <div className="w-full flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 px-8 hide-scrollbar">
          {spread.cards.map((card, i) => (
            <div key={`carousel-${card.id}`} className="snap-center shrink-0 w-[75%] sm:w-[45%] md:w-[30%] lg:w-[22%] relative aspect-[3/4]">
              {renderCard(card, i, "relative w-full h-full cursor-pointer group")}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderShadowWorkSpread = () => {
    const positions = [
      { left: '10%', top: '10%' }, // Mask
      { left: '50%', top: '10%', transform: 'translateX(-50%)' }, // Shadow
      { left: '90%', top: '10%', transform: 'translateX(-100%)' }, // Root
      { left: '30%', top: '40%', transform: 'translateX(-50%)' }, // Mirror
      { left: '70%', top: '40%', transform: 'translateX(-50%)' }, // Light
      { left: '50%', top: '70%', transform: 'translateX(-50%)' }, // Integration
      { left: '50%', top: '90%', transform: 'translate(-50%, -50%)' }, // Revelation
    ];
    return renderCarouselSpread(positions);
  };

  const renderCrossroadsSpread = () => {
    const positions = [
      { left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }, // Significator
      { left: '35%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }, // Divine Intersect (Crossing)
      { left: '35%', top: '15%', transform: 'translate(-50%, -50%)' }, // Maiden
      { left: '35%', top: '85%', transform: 'translate(-50%, -50%)' }, // Mother
      { left: '15%', top: '85%', transform: 'translate(-50%, -50%)' }, // Crone
      { left: '75%', top: '50%', transform: 'translate(-50%, -50%)' }, // Path Forward
    ];
    return renderCarouselSpread(positions);
  };

  const renderLinearSpread = () => {
    return (
      <div className="flex flex-wrap justify-center gap-6 my-8">
        {spread.cards.map((card, i) => (
          <div key={card.id} className="relative">
            {renderCard(card, i, "relative w-[30%] sm:w-[25%] md:w-[20%] lg:w-[16%] aspect-[3/4] cursor-pointer group")}
          </div>
        ))}
      </div>
    );
  };

  const renderPsychologicalWebbingSpread = () => {
    const positions: React.CSSProperties[] = [];
    const centerX = 50;
    const centerY = 50;
    
    spread.cards.forEach((_, i) => {
      if (i === 0) {
        positions.push({ left: `${centerX}%`, top: `${centerY}%`, transform: 'translate(-50%, -50%)', zIndex: 10 });
      } else {
        const angle = (i * 137.5) * (Math.PI / 180);
        const radius = 20 + (i * 5);
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

    const svgLines = spread.cards.map((_, i) => {
      if (i === 0) return null;
      const pos1 = positions[0];
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
    });

    return renderCarouselSpread(positions, svgLines);
  };

  const focusedCardIndex = spread.cards.findIndex(c => c.id === focusedCardId);
  const focusedCard = focusedCardIndex !== -1 ? spread.cards[focusedCardIndex] : null;

  return (
    <>
      {spread.type === 'Shadow Work' && renderShadowWorkSpread()}
      {spread.type === 'Hecate\'s Crossroads' && renderCrossroadsSpread()}
      {spread.type === 'Psychological Webbing' && renderPsychologicalWebbingSpread()}
      {spread.type !== 'Shadow Work' && spread.type !== 'Hecate\'s Crossroads' && spread.type !== 'Psychological Webbing' && renderLinearSpread()}

      {focusedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8" onClick={closeFocusedCard}>
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 max-w-7xl w-full h-full" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-50" onClick={closeFocusedCard}>
              <X size={32} />
            </button>
            
            {/* Large Card */}
            <motion.div 
              layoutId={`card-${focusedCard.id}`}
              className="relative h-[70vh] md:h-[85vh] aspect-[3/4] flex-shrink-0"
            >
              <div 
                className="w-full h-full bg-zinc-900 rounded-xl shadow-2xl overflow-hidden"
                style={{ 
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
                  filter: getElementalGlow(focusedCard.elementalDignity) || 'none'
                }}
              >
                {focusedCard.base64Image ? (
                  <img src={`data:image/jpeg;base64,${focusedCard.base64Image}`} alt={focusedCard.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-center text-zinc-400">
                    {focusedCard.name}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Card Qualities */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-center max-w-md bg-zinc-900/80 p-6 md:p-8 rounded-xl border border-zinc-800 shadow-xl"
            >
              <p className="text-red-500 font-mono text-sm uppercase tracking-widest mb-2">
                <span className="text-red-500/80 mr-2">{focusedCardIndex + 1}.</span>
                {focusedCard.positionName}
              </p>
              <h2 className="text-3xl md:text-4xl font-serif text-zinc-100 mb-6">{focusedCard.name}</h2>
              
              <div className="space-y-4">
                {focusedCard.elementalDignity && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Elemental Dignity</h3>
                    <p className="text-zinc-300">{focusedCard.elementalDignity}</p>
                  </div>
                )}
                {focusedCard.numerologicalEmanation && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Numerological Emanation</h3>
                    <p className="text-zinc-300">{focusedCard.numerologicalEmanation}</p>
                  </div>
                )}
                {focusedCard.cardNumber && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Card Number</h3>
                    <p className="text-zinc-300">{focusedCard.cardNumber}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
};
