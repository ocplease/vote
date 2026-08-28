export type JudgeId = 'judge_a' | 'judge_b' | 'judge_c';

export interface Judge {
  id: JudgeId;
  name: string;
  shortName: string;
  roleDescription: string;
  avatar: string;
  color: string;
  score: number | null;
  submitted: boolean;
  submittedAt?: number | null;
  isOnline?: boolean;
}

export interface Contestant {
  id: string;
  number: string;
  name: string;
  project: string;
  group: string;
  avatar?: string;
}

export interface ScoreRecord {
  id: string;
  contestantId: string;
  contestantNumber: string;
  contestantName: string;
  contestantProject: string;
  contestantGroup: string;
  scores: {
    judge_a: number;
    judge_b: number;
    judge_c: number;
  };
  totalScore: number;
  averageScore: number;
  timestamp: number;
}

export interface SystemSettings {
  soundEnabled: boolean;
  scoreStep: number; // 1 or 0.5
  scoringScaleMax: number; // default 10
  showJudgeScoreInstantly: boolean; // whether to show score along with avatar or hide until host/reveal
  title: string;
}

export interface CompetitionState {
  currentContestant: Contestant;
  judges: Judge[];
  allCompleted: boolean;
  history: ScoreRecord[];
  queue: Contestant[];
  settings: SystemSettings;
  lastUpdated: number;
  lastSubmittedJudgeId?: JudgeId | null;
}

export type WSEvent =
  | { type: 'INIT_STATE'; payload: CompetitionState }
  | { type: 'SYNC_STATE'; payload: CompetitionState }
  | { type: 'JUDGE_SUBMIT'; payload: { judgeId: JudgeId; score: number } }
  | { type: 'RESET_NEXT'; payload?: { nextContestant?: Contestant } }
  | { type: 'RETRY_CURRENT'; payload?: { contestantId: string } }
  | { type: 'SET_CONTESTANT'; payload: Contestant }
  | { type: 'UPDATE_JUDGE'; payload: { judgeId: JudgeId; name?: string; roleDescription?: string; avatar?: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SystemSettings> }
  | { type: 'DELETE_HISTORY'; payload: { id: string } }
  | { type: 'ADD_CONTESTANT'; payload: Contestant }
  | { type: 'UPDATE_QUEUE'; payload: Contestant[] }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'PING' };
