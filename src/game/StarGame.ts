export type Faction = 'White' | 'Black';

export interface SGSPiece {
  pieceId: string;
  faction: Faction;
  alchemicalId: string;
  permutationTier: number;
  coordinates: { x: number; y: number; z: number };
}

export interface SGSMetadata {
  turn: number;
  activePlayer: Faction;
  aeonicPhase: string;
}

export interface SGSState {
  metadata: SGSMetadata;
  boardState: SGSPiece[];
  history: string[];
}

export class StarGameEngine {
  public state: SGSState;

  constructor() {
    this.state = {
      metadata: {
        turn: 1,
        activePlayer: 'White',
        aeonicPhase: 'Initiation'
      },
      boardState: [],
      history: []
    };
    this.setupInitialPieces();
  }

  private setupInitialPieces() {
    // Initial pieces based on the 9x9x7 grid
    this.state.boardState = [
      {
        pieceId: "W-VEN-2-01",
        faction: "White",
        alchemicalId: "Venus",
        permutationTier: 2,
        coordinates: { x: 4, y: 4, z: 2 }
      },
      {
        pieceId: "B-MAR-1-04",
        faction: "Black",
        alchemicalId: "Mars",
        permutationTier: 1,
        coordinates: { x: 7, y: 2, z: 3 }
      },
      {
        pieceId: "W-MOO-1-01",
        faction: "White",
        alchemicalId: "Moon",
        permutationTier: 1,
        coordinates: { x: 1, y: 1, z: 1 }
      },
      {
        pieceId: "B-SUN-3-01",
        faction: "Black",
        alchemicalId: "Sun",
        permutationTier: 3,
        coordinates: { x: 9, y: 9, z: 4 }
      }
    ];
  }

  public importSGS(payload: string): SGSState {
    const parsed = JSON.parse(payload) as SGSState;
    if (!parsed.metadata || !parsed.boardState) {
      throw new Error("Invalid SGS payload");
    }
    this.state = parsed;
    return this.state;
  }

  public exportSGS(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public getPieceAt(x: number, y: number, z: number): SGSPiece | undefined {
    return this.state.boardState.find(p => p.coordinates.x === x && p.coordinates.y === y && p.coordinates.z === z);
  }

  public validateCausalMove(piece: SGSPiece, targetX: number, targetY: number, targetZ: number): boolean {
    // Causal move: movement within the same board (z remains constant)
    if (piece.coordinates.z !== targetZ) return false;
    
    const dx = Math.abs(piece.coordinates.x - targetX);
    const dy = Math.abs(piece.coordinates.y - targetY);
    
    // Basic causal movement: up to permutationTier squares in any direction
    if (dx > piece.permutationTier || dy > piece.permutationTier) return false;
    if (dx === 0 && dy === 0) return false;
    
    return true;
  }

  public validateAcausalMove(piece: SGSPiece, targetX: number, targetY: number, targetZ: number): boolean {
    // Acausal move: movement between boards (z changes)
    if (piece.coordinates.z === targetZ) return false;
    
    const dz = Math.abs(piece.coordinates.z - targetZ);
    
    // Basic acausal movement: can move up/down boards up to permutationTier
    if (dz > piece.permutationTier) return false;
    
    // Acausal moves might have x/y restrictions, but for now allow same x/y or adjacent
    const dx = Math.abs(piece.coordinates.x - targetX);
    const dy = Math.abs(piece.coordinates.y - targetY);
    
    if (dx > 1 || dy > 1) return false;
    
    return true;
  }

  public movePiece(pieceId: string, targetX: number, targetY: number, targetZ: number): boolean {
    const piece = this.state.boardState.find(p => p.pieceId === pieceId);
    if (!piece) return false;

    if (piece.faction !== this.state.metadata.activePlayer) {
      return false; // Not this player's turn
    }

    // Check bounds
    if (targetX < 1 || targetX > 9 || targetY < 1 || targetY > 9 || targetZ < 1 || targetZ > 7) {
      return false;
    }

    // Check if target is occupied by same faction
    const targetPiece = this.getPieceAt(targetX, targetY, targetZ);
    if (targetPiece && targetPiece.faction === piece.faction) {
      return false; // Cannot capture own piece
    }

    // Validate move logic
    const isCausal = piece.coordinates.z === targetZ;
    const isValid = isCausal 
      ? this.validateCausalMove(piece, targetX, targetY, targetZ)
      : this.validateAcausalMove(piece, targetX, targetY, targetZ);

    if (!isValid) return false;

    // Capture
    if (targetPiece && targetPiece.faction !== piece.faction) {
      this.state.boardState = this.state.boardState.filter(p => p.pieceId !== targetPiece.pieceId);
      this.state.history.push(`${piece.faction} captured ${targetPiece.faction} piece at z${targetZ}(${targetX},${targetY})`);
    }

    const oldCoords = { ...piece.coordinates };
    piece.coordinates = { x: targetX, y: targetY, z: targetZ };

    // Transformation logic on acausal move
    if (!isCausal) {
      piece.permutationTier = piece.permutationTier < 3 ? piece.permutationTier + 1 : 1;
    }

    this.state.history.push(`${pieceId}: z${oldCoords.z}(${oldCoords.x},${oldCoords.y}) -> z${targetZ}(${targetX},${targetY})[Permutation: Tier ${piece.permutationTier}]`);
    this.state.metadata.turn += 1;
    this.state.metadata.activePlayer = this.state.metadata.activePlayer === 'White' ? 'Black' : 'White';

    // Check win conditions
    this.checkWinConditions();

    return true;
  }

  private checkWinConditions() {
    const whitePieces = this.state.boardState.filter(p => p.faction === 'White');
    const blackPieces = this.state.boardState.filter(p => p.faction === 'Black');

    if (whitePieces.length === 0) {
      this.state.metadata.aeonicPhase = 'Black Victory (Physical Domination)';
    } else if (blackPieces.length === 0) {
      this.state.metadata.aeonicPhase = 'White Victory (Physical Domination)';
    }

    // Acausal Supremacy: occupying Naos (z=7) with a Tier 3 piece
    const whiteNaos = whitePieces.some(p => p.coordinates.z === 7 && p.permutationTier === 3);
    const blackNaos = blackPieces.some(p => p.coordinates.z === 7 && p.permutationTier === 3);

    if (whiteNaos) {
      this.state.metadata.aeonicPhase = 'White Victory (Acausal Supremacy)';
    } else if (blackNaos) {
      this.state.metadata.aeonicPhase = 'Black Victory (Acausal Supremacy)';
    }
  }
}
