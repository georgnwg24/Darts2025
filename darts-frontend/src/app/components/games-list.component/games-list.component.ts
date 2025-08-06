import { Component } from '@angular/core';
import { GamesService } from '../../services/games.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.models';

@Component({
  selector: 'app-games-list.component',
  imports: [CommonModule],
  templateUrl: './games-list.component.html',
  styleUrl: './games-list.component.css'
})
export class GamesListComponent {
  games: Game[] = [];
  displayedGames: Game[] = [];
  showArchived = false;

  constructor (
    private gamesService: GamesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.gamesService.getAllGames().subscribe(games => {
      this.games = games;
      this.filterGames();
    })
  }

  filterGames(): void {
    this.displayedGames = this.games.filter(
      game => game.archived === this.showArchived
    );
  }

  toggleArchivedView(): void {
    this.showArchived = !this.showArchived;
    this.filterGames();
  }

  deleteGame(id: string, index: number): void {
    if (confirm('Are you sure you want to delete this team?')) {
      this.gamesService.deleteGame(id).subscribe(() => {
        this.games.splice(index, 1);
        this.filterGames();
      });
    }
  }

  toggleArchive(id: string): void {
    this.gamesService.toggleArchive(id).subscribe(updatedGame => {
      const index = this.games.findIndex(g => g._id === id);
      if (index !== -1) {
        this.games[index] = updatedGame;
        this.filterGames();
      }
    });
  }

  redirectToAddGame(): void {
    this.router.navigate(['/games/create']);
  }

  redirectToGameDashboard(id: string): void {
    this.router.navigate(['/games', id]);
  }
}