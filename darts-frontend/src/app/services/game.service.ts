import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { CreateGameDto, Game, RecordThrowDto } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly gamesUrl = `/api/games`;

  constructor(
    private http: HttpClient,
  ) { }

  createGame(createGameDto: CreateGameDto): Observable<Game> {
    return this.http.post<Game>(this.gamesUrl, createGameDto)
      .pipe(catchError(this.handleError));
  }

  getGameById(id: string): Observable<Game> {
    const url = `${this.gamesUrl}/${id}`;
    return this.http.get<Game>(url)
      .pipe(catchError(this.handleError));
  }

  getAllGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.gamesUrl)
      .pipe(catchError(this.handleError));
  }

  recordThrow(id: string, recordThrowDto: RecordThrowDto): Observable<Game> {
    const url = `${this.gamesUrl}/record/${id}`;
    return this.http.post<Game>(url, recordThrowDto)
      .pipe(catchError(this.handleError));
  }

  rollBackThrow(id: string): Observable<Game> {
    const url = `${this.gamesUrl}/rollback/${id}`;
    return this.http.post<Game>(url, {})
      .pipe(catchError(this.handleError));
  }

  deleteGame(id: string): Observable<void> {
    const url = `${this.gamesUrl}/${id}`;
    return this.http.delete<void>(url)
      .pipe(catchError(this.handleError));
  }

  toggleArchive(id: string): Observable<Game> {
    const url = `${this.gamesUrl}/archive/${id}`;
    return this.http.patch<Game>(url, {})
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server returned code ${error.status}, body was: ${JSON.stringify(error.error)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
