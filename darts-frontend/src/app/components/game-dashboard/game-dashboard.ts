import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DartboardComponent } from '../dartboard.component/dartboard.component';
import { Subject, takeUntil } from 'rxjs';
import { Game, RecordThrowDto, TeamData } from '../../models/game.models';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-game-dashboard',
  imports: [CommonModule, DartboardComponent],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.css'
})
export class GameDashboard {
  
  game: Game | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  
  // State management
  isDartboardActive = false;
  isTurnEnded = false;  
  lastPlayedTeamIndex: number | null = null; 

  private destroy$ = new Subject<void>();

    constructor(
    private route: ActivatedRoute,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGame(id);
    } else {
      this.errorMessage = 'Invalid game ID';
      this.isLoading = false;
    }
  }

  loadGame(id: string): void {
    this.gameService.getGameById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (game) => {
          this.game = game;
          this.isLoading = false;
          this.isDartboardActive = game.status === 'active';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to load game';
          this.isLoading = false;
        }
      });
  }

  // Calculate team score from throws
  getTeamScore(teamIndex: number): number {
    if (!this.game) return 0;
    const team = this.game.teamData[teamIndex];
    let teamScore = team.throwsByRound.flat().reduce((sum, score) => sum + score, 0);
    if (this.game.scoreLimit) {
      return this.game.scoreLimit - teamScore;
    }
    return teamScore;
  }

  // Get currently active team (for display)
  get currentTeam(): TeamData | null {
    if (!this.game) return null;
    return this.game.teamData[this.game.currentTeamIndex];
  }

  // Get current player name considering turn end state
  get currentPlayerName(): string {
    if (!this.game) return '';
    
    let teamIndex: number;
    let playerIndex: number;
    if (this.isTurnEnded && this.lastPlayedTeamIndex !== null) {
      teamIndex = this.lastPlayedTeamIndex;
      let nOfPlayers = this.game.teamData[teamIndex].playerNames.length;
      playerIndex = (this.game.teamData[teamIndex].currentPlayerIndex - 1 + nOfPlayers) % nOfPlayers;
    } else {
      teamIndex = this.game.currentTeamIndex;
      playerIndex = this.game.teamData[teamIndex].currentPlayerIndex;
    }
    
    const team = this.game.teamData[teamIndex];
    return team.playerNames[playerIndex];
  }

  // Get throws to display (shows previous team's throws when turn ended)
  get currentRoundThrows(): number[] {
    if (!this.game) return [];
    
    let teamIndex: number;
    
    // When turn ended, show last played team's throws
    if (this.isTurnEnded && this.lastPlayedTeamIndex !== null) {
      teamIndex = this.lastPlayedTeamIndex;
    } else {
      teamIndex = this.game.currentTeamIndex;
    }
    
    const team = this.game.teamData[teamIndex];
    if (!team.throwsByRound.length) return [];
    
    return team.throwsByRound[team.throwsByRound.length - 1];
  }

  onThrowRecorded(score: number): void {
    if (!this.game || !this.currentTeam) return;
        
    const previousTeamIndex = this.game.currentTeamIndex;
    const recordThrowDto: RecordThrowDto = {
      teamName: this.currentTeam.teamName,
      score: score
    };
    
    this.gameService.recordThrow(this.game._id, recordThrowDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedGame) => {
          this.game = updatedGame;
          
          if (updatedGame.currentTeamIndex !== previousTeamIndex) {
            this.isTurnEnded = true;
            this.isDartboardActive = false;
            this.lastPlayedTeamIndex = previousTeamIndex; // Store which team just finished
          }

          // Handle game completion
          if (updatedGame.status === 'complete') {
            this.isDartboardActive = false;
            this.isTurnEnded = false;
          }
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to record throw';
          this.isDartboardActive = true;
        }
      });
  }

  onRollback(): void {
    if (!this.game) return;

    this.lastPlayedTeamIndex = null;
    
    this.gameService.rollBackThrow(this.game._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rolledBackGame) => {
          this.game = rolledBackGame;
          this.isTurnEnded = false;
          this.isDartboardActive = rolledBackGame.status === 'active';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to rollback throw';
        }
      });
  }

  onContinue(): void {
    this.isTurnEnded = false;
    this.lastPlayedTeamIndex = null;
    this.isDartboardActive = this.game?.status === 'active';
  }

  onBackToGamesTabel(): void {
    this.router.navigate(['/games']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
