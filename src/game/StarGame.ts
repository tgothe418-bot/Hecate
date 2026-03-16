export type PieceDesignation = 
  | 'α(α)' | 'α(β)' | 'α(γ)' 
  | 'β(α)' | 'β(β)' | 'β(γ)' 
  | 'γ(α)' | 'γ(β)' | 'γ(γ)';

export type PlayerColor = 'White' | 'Black';

export type BoardName = 'Sirius' | 'Arcturus' | 'Antares' | 'Mira' | 'Rigel' | 'Deneb' | 'Naos';

export interface Piece {
  id: string;
  color: PlayerColor;
  designation: PieceDesignation;
}

export interface Square {
  id: string; // e.g., 'A1', 'B2'
  color: 'black' | 'white';
  piece: Piece | null;
}

export interface Board {
  name: BoardName;
  level: number; // 1 to 7
  squares: Square[]; // 18 squares
}

const DESIGNATION_SEQUENCE: PieceDesignation[] = [
  'α(α)', 'α(β)', 'α(γ)', 
  'β(α)', 'β(β)', 'β(γ)', 
  'γ(α)', 'γ(β)', 'γ(γ)'
];

export class StarGameEngine {
  boards: Map<BoardName, Board>;
  currentPlayer: PlayerColor;
  moveHistory: string[];

  constructor() {
    this.boards = new Map();
    this.currentPlayer = 'White';
    this.moveHistory = [];
    this.initializeBoards();
    this.setupInitialPieces();
  }

  private initializeBoards() {
    const boardNames: BoardName[] = ['Sirius', 'Arcturus', 'Antares', 'Mira', 'Rigel', 'Deneb', 'Naos'];
    boardNames.forEach((name, index) => {
      const squares: Square[] = [];
      // 18 squares per board (9 black, 9 white)
      // Represented as a 3x6 grid for simplicity: A1-C6
      const cols = ['A', 'B', 'C'];
      for (let row = 1; row <= 6; row++) {
        for (let c = 0; c < cols.length; c++) {
          const col = cols[c];
          squares.push({
            id: `${col}${row}`,
            color: (row + c) % 2 === 0 ? 'black' : 'white',
            piece: null
          });
        }
      }
      this.boards.set(name, {
        name,
        level: index + 1,
        squares
      });
    });
  }

  private setupInitialPieces() {
    // Exoteric Starting Positions (Simple Game)
    // This is a simplified setup based on the rules provided.
    // In a full implementation, exact starting squares would be specified.
    
    const placePieces = (boardName: BoardName, color: PlayerColor, designations: PieceDesignation[], count: number) => {
      const board = this.boards.get(boardName);
      if (!board) return;
      
      let placed = 0;
      for (const square of board.squares) {
        if (placed >= count) break;
        // Simple placement logic: White on rows 1-2, Black on rows 5-6
        if ((color === 'White' && parseInt(square.id[1]) <= 2) || 
            (color === 'Black' && parseInt(square.id[1]) >= 5)) {
          if (!square.piece) {
            square.piece = {
              id: `${color}-${boardName}-${placed}`,
              color,
              designation: designations[placed % designations.length]
            };
            placed++;
          }
        }
      }
    };

    const alphaSet: PieceDesignation[] = ['α(α)', 'α(β)', 'α(γ)'];
    const betaSet: PieceDesignation[] = ['β(α)', 'β(β)', 'β(γ)'];
    const gammaSet: PieceDesignation[] = ['γ(α)', 'γ(β)', 'γ(γ)'];

    ['White', 'Black'].forEach(color => {
      const c = color as PlayerColor;
      placePieces('Sirius', c, alphaSet, 6);
      placePieces('Arcturus', c, alphaSet, 3);
      placePieces('Antares', c, betaSet, 6);
      // Mira is empty
      placePieces('Rigel', c, betaSet, 3);
      placePieces('Deneb', c, gammaSet, 6);
      placePieces('Naos', c, gammaSet, 3);
    });
  }

  public getBoardState(boardName: BoardName): Board | undefined {
    return this.boards.get(boardName);
  }

  public getAllBoardsState(): Record<string, any> {
    const state: Record<string, any> = {};
    this.boards.forEach((board, name) => {
      state[name] = board.squares.filter(s => s.piece).map(s => ({
        square: s.id,
        piece: s.piece
      }));
    });
    return state;
  }

  public movePiece(fromBoard: BoardName, fromSquare: string, toBoard: BoardName, toSquare: string): boolean {
    const sourceBoard = this.boards.get(fromBoard);
    const targetBoard = this.boards.get(toBoard);

    if (!sourceBoard || !targetBoard) return false;

    const sourceSq = sourceBoard.squares.find(s => s.id === fromSquare);
    const targetSq = targetBoard.squares.find(s => s.id === toSquare);

    if (!sourceSq || !targetSq || !sourceSq.piece) return false;

    const piece = sourceSq.piece;

    if (piece.color !== this.currentPlayer) return false;

    // TODO: Implement strict movement validation based on Alpha, Beta, Gamma rules
    // For now, we perform the move to demonstrate the Metamorphosis mechanic

    // Execute Move
    targetSq.piece = piece;
    sourceSq.piece = null;

    // The Law of Metamorphosis
    this.applyMetamorphosis(piece);

    this.moveHistory.push(`${this.currentPlayer}: ${piece.designation} from ${fromBoard} ${fromSquare} to ${toBoard} ${toSquare}`);
    this.currentPlayer = this.currentPlayer === 'White' ? 'Black' : 'White';

    return true;
  }

  private applyMetamorphosis(piece: Piece) {
    const currentIndex = DESIGNATION_SEQUENCE.indexOf(piece.designation);
    const nextIndex = (currentIndex + 1) % DESIGNATION_SEQUENCE.length;
    piece.designation = DESIGNATION_SEQUENCE[nextIndex];
  }
}
