export enum GameStatus {
  ACTIVE = 'active',
  COMPLETE = 'complete'
}

export interface TeamData {
  teamName: string;
  playerNames: string[];
  throwsByRound: number[][];
  currentPlayerIndex: number;
}

export interface Game {
  _id: string;
  currentRound: number;
  roundLimit: number;
  scoreLimit?: number;
  teamData: TeamData[];
  currentTeamIndex: number;
  status: GameStatus;
  gameWinner?: string;
  archived: boolean;
}

export interface CreateTeamDataDto {
  teamName: string;
  playerNames: string[];
}

export interface CreateGameDto {
  roundLimit: number;
  scoreLimit?: number;
  teamData: CreateTeamDataDto[];
}

export interface RecordThrowDto {
  teamName: string;
  score: number;
}