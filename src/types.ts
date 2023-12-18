

export interface PGNFormat {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  fen: string;
  pgn: PGNMove[];
}
export interface PGNMove{
  move:string;
  move_number?: number;
  ravs?: PGNMove[];
  comments?: string[];
}

export const blankPGN:PGNFormat = {
  fen: '8/8/8/8/8/8/8/8 w - - 0 1',
  pgn: []
}