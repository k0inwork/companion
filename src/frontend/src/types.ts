export interface RadarWord {
  word: string;
  frequency: number;
  context: string;
  status: 'new' | 'repeated' | 'faded';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
