export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  originalCommand?: string;
  isGame?: boolean;
  spread?: Spread;
}

export type DeckArchitecture = 'Standard/Orthodox (Rider-Waite-Smith)' | 'The Book of Thoth (Crowley)';
export type OperativeModel = 'Psychological Mapping' | 'Shadow Reclamation' | 'Divinatory/Acausal';

export interface TarotSessionConfig {
  deckArchitecture: DeckArchitecture;
  operativeModel: OperativeModel;
}

export interface TarotCard {
  id: string;
  name: string;
  positionName: string;
  base64Image?: string;
  elementalDignity?: string;
  numerologicalEmanation?: string;
  isRevealed: boolean;
  x?: number; // For absolute positioning
  y?: number; // For absolute positioning
}

export interface Spread {
  type: 'Shadow Work' | 'Hecate\'s Crossroads' | 'Psychological Webbing' | 'Linear';
  cards: TarotCard[];
}
