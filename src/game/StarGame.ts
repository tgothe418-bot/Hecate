export type Faction = 'White' | 'Black';

export interface SGSPiece {
  pieceId: string;
  faction: Faction;
  metamorphosisState: number; // 1 to 9
  coordinates: { x: number; y: number; z: number };
  miraTurnCount: number;
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
    this.state.boardState = [];
    let pieceCounter = 1;

    const addSet = (faction: Faction, z: number, baseState: number, count: number, startY: number) => {
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < 3; j++) {
          this.state.boardState.push({
            pieceId: `${faction.charAt(0)}-${z}-${pieceCounter++}`,
            faction,
            metamorphosisState: baseState + j,
            coordinates: { x: 1 + j + (i * 3), y: startY, z },
            miraTurnCount: 0
          });
        }
      }
    };

    // Sirius (Z=1): 6 White α sets, 6 Black α sets (2 sets of 3 pieces = 6 pieces)
    addSet('White', 1, 1, 2, 1);
    addSet('Black', 1, 1, 2, 9);

    // Arcturus (Z=2): 3 White α sets, 3 Black α sets (1 set of 3 pieces = 3 pieces)
    addSet('White', 2, 1, 1, 1);
    addSet('Black', 2, 1, 1, 9);

    // Antares (Z=3): 6 White β sets, 6 Black β sets
    addSet('White', 3, 4, 2, 1);
    addSet('Black', 3, 4, 2, 9);

    // Mira (Z=4): Empty

    // Rigel (Z=5): 3 White β sets, 3 Black β sets
    addSet('White', 5, 4, 1, 1);
    addSet('Black', 5, 4, 1, 9);

    // Deneb (Z=6): 6 White γ sets, 6 Black γ sets
    addSet('White', 6, 7, 2, 1);
    addSet('Black', 6, 7, 2, 9);

    // Naos (Z=7): 3 White γ sets, 3 Black γ sets
    addSet('White', 7, 7, 1, 1);
    addSet('Black', 7, 7, 1, 9);
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

    const targetPiece = this.getPieceAt(targetX, targetY, targetZ);

    // Capturing logic
    let isCapture = false;
    if (targetPiece) {
      if (targetPiece.faction === piece.faction) {
        return false; // Cannot capture own piece
      }
      if (piece.metamorphosisState !== 9) {
        return false; // ONLY γ(γ) [State 9] can capture
      }
      isCapture = true;
    }

    // Movement validation
    const dz = Math.abs(piece.coordinates.z - targetZ);
    
    if (piece.metamorphosisState <= 3) {
      // Alpha (α) Pieces [States 1-3]: Can only move across the board they are currently on
      if (dz !== 0) return false;
    } else if (piece.metamorphosisState <= 6) {
      // Beta (β) Pieces [States 4-6]: Can move across current board, AND up or down exactly one level
      if (dz > 1) return false;
    } else {
      // Gamma (γ) Pieces [States 7-9]: Can move to any vacant square on any board
      // (Capture logic already handled above)
    }

    // Execute capture
    if (isCapture) {
      this.state.boardState = this.state.boardState.filter(p => p.pieceId !== targetPiece!.pieceId);
      this.state.history.push(`${piece.faction} captured ${targetPiece!.faction} piece at z${targetZ}(${targetX},${targetY})`);
    }

    const oldCoords = { ...piece.coordinates };
    piece.coordinates = { x: targetX, y: targetY, z: targetZ };

    // Metamorphosis
    if (isCapture) {
      // Immediately after executing the capture, the γ(γ) piece reverts to an α(α) piece
      piece.metamorphosisState = 1;
    } else {
      // After any move, transform to next state
      piece.metamorphosisState = piece.metamorphosisState === 9 ? 1 : piece.metamorphosisState + 1;
    }

    // Mira Trap Logic updates
    if (targetZ === 4 && oldCoords.z !== 4) {
      piece.miraTurnCount = 0;
    } else if (targetZ !== 4) {
      piece.miraTurnCount = 0;
    }

    this.state.history.push(`${pieceId}: z${oldCoords.z}(${oldCoords.x},${oldCoords.y}) -> z${targetZ}(${targetX},${targetY}) [State ${piece.metamorphosisState}]`);
    
    this.endTurn();
    return true;
  }

  private endTurn() {
    // Check Mira forfeitures for the active player BEFORE switching turns
    const activePlayerPieces = this.state.boardState.filter(p => p.faction === this.state.metadata.activePlayer);
    
    for (const p of activePlayerPieces) {
      if (p.coordinates.z === 4) {
        // If a piece is on Mira and becomes an α(α) piece (which cannot move between boards), it cannot escape
        if (p.metamorphosisState === 1) {
          this.forfeitPiece(p, "Trapped on Mira as α(α)");
        } else if (p.miraTurnCount >= 3) {
          // Pieces can only stay on Mira for exactly three moves
          this.forfeitPiece(p, "Exceeded Mira time limit");
        } else {
          p.miraTurnCount += 1;
        }
      }
    }

    this.state.metadata.turn += 1;
    this.state.metadata.activePlayer = this.state.metadata.activePlayer === 'White' ? 'Black' : 'White';

    this.checkWinConditions();
  }

  private forfeitPiece(piece: SGSPiece, reason: string) {
    this.state.boardState = this.state.boardState.filter(p => p.pieceId !== piece.pieceId);
    this.state.history.push(`${piece.pieceId} forfeited: ${reason}`);
  }

  private checkWinConditions() {
    const whitePieces = this.state.boardState.filter(p => p.faction === 'White');
    const blackPieces = this.state.boardState.filter(p => p.faction === 'Black');

    if (whitePieces.length === 0) {
      this.state.metadata.aeonicPhase = 'Black Victory (Physical Domination)';
    } else if (blackPieces.length === 0) {
      this.state.metadata.aeonicPhase = 'White Victory (Physical Domination)';
    }

    // Acausal Supremacy: occupying Naos (z=7) with a γ(γ) piece
    const whiteNaos = whitePieces.some(p => p.coordinates.z === 7 && p.metamorphosisState === 9);
    const blackNaos = blackPieces.some(p => p.coordinates.z === 7 && p.metamorphosisState === 9);

    if (whiteNaos) {
      this.state.metadata.aeonicPhase = 'White Victory (Acausal Supremacy)';
    } else if (blackNaos) {
      this.state.metadata.aeonicPhase = 'Black Victory (Acausal Supremacy)';
    }
  }
}
