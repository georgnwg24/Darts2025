import { Routes } from '@angular/router';
import { CreateGame } from './components/create-game/create-game';
import { GamesListComponent } from './components/games-list.component/games-list.component';
import { GameDashboard } from './components/game-dashboard/game-dashboard';

export const routes: Routes = [
    { path: 'games', component: GamesListComponent },
    { path: 'games/create', component: CreateGame},
    { path: 'games/:id', component: GameDashboard },
];
