import { Component } from '@angular/core';
import { CreateGameDto } from '../../models/game.models';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-game',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-game.html',
  styleUrl: './create-game.css'
})
export class CreateGame {
  gameForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router
  ) {
    this.gameForm = this.fb.group({
      roundLimit: [20, [Validators.required, Validators.min(1)]],
      scoreLimit: ['301'],
      homeTeam: this.fb.group({
        teamName: ['Home', [Validators.required, Validators.minLength(2)]],
        player1: ['Player 1', [Validators.required, Validators.minLength(2)]],
        player2: ['Player 2', [Validators.required, Validators.minLength(2)]],
      }),
      awayTeam: this.fb.group({
        teamName: ['Away', [Validators.required, Validators.minLength(2)]],
        player1: ['Player 3', [Validators.required, Validators.minLength(2)]],
        player2: ['Player 4', [Validators.required, Validators.minLength(2)]],
      }),
    });
  }

  onSubmit(): void {
    if (this.gameForm.invalid) {
      this.markFormGroupTouched(this.gameForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formValue = this.gameForm.value;
    const createGameDto: CreateGameDto = {
      roundLimit: formValue.roundLimit,
      scoreLimit: formValue.scoreLimit || undefined,
      teamData: [
        {
          teamName: formValue.homeTeam.teamName,
          playerNames: [
            formValue.homeTeam.player1,
            formValue.homeTeam.player2
          ]
        },
        {
          teamName: formValue.awayTeam.teamName,
          playerNames: [
            formValue.awayTeam.player1,
            formValue.awayTeam.player2
          ]
        }
      ]
    };

    this.gameService.createGame(createGameDto).subscribe({
      next: (game) => {
        this.isLoading = false;
        this.router.navigate(['/games', game._id]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to create game. Please try again.';
      }
    });
  }

  navigateToGames(){
    this.router.navigate(['/games']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
