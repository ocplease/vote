import crypto from 'node:crypto';
import type { CompetitionState, Contestant, Judge, JudgeId, ScoreRecord } from '../types.js';
import { createDefaultState } from '../defaultState.js';

export type CompetitionAction =
  | { type: 'submitScore'; judgeId: JudgeId; score: number }
  | { type: 'resetNext' }
  | { type: 'retryCurrent' }
  | { type: 'setContestant'; contestant: Contestant }
  | { type: 'updateCurrentContestant'; contestant: Contestant }
  | { type: 'activateContestant'; contestantId: string }
  | { type: 'updateQueue'; queue: Contestant[] }
  | { type: 'updateJudges'; judges: Judge[] }
  | { type: 'updateSettings'; title: string }
  | { type: 'deleteHistory'; id: string }
  | { type: 'clearHistory' };

const STATE_KEY = process.env.COMPETITION_STATE_KEY || 'vote:competition:state:v2';
const LOCK_KEY = `${STATE_KEY}:lock`;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let memoryState = createDefaultState();

function hasRedis() {
  return Boolean(redisUrl && redisToken);
}

async function redisCommand<T>(...command: Array<string | number>): Promise<T> {
  if (!redisUrl || !redisToken) throw new Error('Redis is not configured');
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Redis request failed (${response.status})`);
  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result as T;
}

async function readRedisState(): Promise<CompetitionState> {
  const raw = await redisCommand<string | null>('GET', STATE_KEY);
  if (raw) return JSON.parse(raw) as CompetitionState;
  const seeded = createDefaultState();
  await redisCommand('SET', STATE_KEY, JSON.stringify(seeded));
  return seeded;
}

export async function getCompetitionState(): Promise<CompetitionState> {
  return hasRedis() ? readRedisState() : structuredClone(memoryState);
}

async function acquireLock(): Promise<string> {
  const token = crypto.randomUUID();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await redisCommand<string | null>('SET', LOCK_KEY, token, 'NX', 'PX', 5000);
    if (result === 'OK') return token;
    await new Promise((resolve) => setTimeout(resolve, 50 + attempt * 10));
  }
  throw new Error('系统正忙，请稍后重试');
}

async function releaseLock(token: string) {
  const current = await redisCommand<string | null>('GET', LOCK_KEY);
  if (current === token) await redisCommand('DEL', LOCK_KEY);
}

function resetJudgeScores(state: CompetitionState) {
  state.judges = state.judges.map((judge) => ({
    ...judge,
    score: null,
    submitted: false,
    submittedAt: null,
  }));
  state.allCompleted = false;
  state.lastSubmittedJudgeId = null;
}

function recordCompletedScore(state: CompetitionState) {
  if (!state.judges.every((judge) => judge.submitted && judge.score !== null)) return;
  state.allCompleted = true;
  const scores = {
    judge_a: state.judges.find((judge) => judge.id === 'judge_a')?.score ?? 0,
    judge_b: state.judges.find((judge) => judge.id === 'judge_b')?.score ?? 0,
    judge_c: state.judges.find((judge) => judge.id === 'judge_c')?.score ?? 0,
  };
  const totalScore = Number((scores.judge_a + scores.judge_b + scores.judge_c).toFixed(2));
  const record: ScoreRecord = {
    id: `rec-${state.currentContestant.id}-${Date.now()}`,
    contestantId: state.currentContestant.id,
    contestantNumber: state.currentContestant.number,
    contestantName: state.currentContestant.name,
    contestantProject: state.currentContestant.project,
    contestantGroup: state.currentContestant.group,
    scores,
    totalScore,
    averageScore: Number((totalScore / state.judges.length).toFixed(2)),
    timestamp: Date.now(),
  };
  const existingIndex = state.history.findIndex((item) => item.contestantId === record.contestantId);
  if (existingIndex >= 0) state.history[existingIndex] = record;
  else state.history.unshift(record);
}

function validateContestant(contestant: Contestant) {
  return contestant && contestant.id && contestant.name?.trim() && contestant.project?.trim();
}

function applyAction(state: CompetitionState, action: CompetitionAction): CompetitionState {
  switch (action.type) {
    case 'submitScore': {
      if (!['judge_a', 'judge_b', 'judge_c'].includes(action.judgeId)) throw new Error('未找到指定专家');
      if (!Number.isInteger(action.score) || action.score < 5 || action.score > 10) {
        throw new Error('评分必须为 5 到 10 之间的整数');
      }
      const judge = state.judges.find((item) => item.id === action.judgeId);
      if (!judge) throw new Error('未找到指定专家');
      judge.score = action.score;
      judge.submitted = true;
      judge.submittedAt = Date.now();
      state.lastSubmittedJudgeId = action.judgeId;
      recordCompletedScore(state);
      break;
    }
    case 'resetNext': {
      recordCompletedScore(state);
      const next = state.queue.shift();
      if (!next) throw new Error('候场队列为空，请先添加参赛项目');
      state.currentContestant = next;
      resetJudgeScores(state);
      break;
    }
    case 'retryCurrent':
      resetJudgeScores(state);
      break;
    case 'setContestant':
      if (!validateContestant(action.contestant)) throw new Error('参赛项目信息不完整');
      state.currentContestant = { ...action.contestant };
      resetJudgeScores(state);
      break;
    case 'updateCurrentContestant':
      if (!validateContestant(action.contestant)) throw new Error('参赛项目信息不完整');
      state.currentContestant = { ...action.contestant };
      break;
    case 'activateContestant': {
      const index = state.queue.findIndex((item) => item.id === action.contestantId);
      if (index < 0) throw new Error('候场项目不存在或已被移除');
      const [contestant] = state.queue.splice(index, 1);
      state.currentContestant = contestant;
      resetJudgeScores(state);
      break;
    }
    case 'updateQueue':
      if (!Array.isArray(action.queue) || action.queue.some((item) => !validateContestant(item))) {
        throw new Error('候场项目格式无效');
      }
      state.queue = action.queue.map((item) => ({ ...item }));
      break;
    case 'updateJudges':
      if (!Array.isArray(action.judges) || action.judges.length !== 3) throw new Error('专家数量必须为 3 位');
      state.judges = action.judges.map((updated) => {
        const existing = state.judges.find((judge) => judge.id === updated.id);
        return {
          ...updated,
          score: existing?.score ?? null,
          submitted: existing?.submitted ?? false,
          submittedAt: existing?.submittedAt ?? null,
          isOnline: existing?.isOnline ?? true,
        };
      });
      break;
    case 'updateSettings':
      if (typeof action.title !== 'string' || !action.title.trim()) throw new Error('赛事标题不能为空');
      state.settings = { ...state.settings, title: action.title.trim() };
      break;
    case 'deleteHistory':
      state.history = state.history.filter((item) => item.id !== action.id);
      break;
    case 'clearHistory':
      state.history = [];
      break;
    default:
      throw new Error('不支持的操作');
  }
  state.lastUpdated = Date.now();
  return state;
}

export async function dispatchCompetitionAction(action: CompetitionAction): Promise<CompetitionState> {
  if (!hasRedis()) {
    memoryState = applyAction(structuredClone(memoryState), action);
    return structuredClone(memoryState);
  }

  const lockToken = await acquireLock();
  try {
    const state = await readRedisState();
    const next = applyAction(state, action);
    await redisCommand('SET', STATE_KEY, JSON.stringify(next));
    return next;
  } finally {
    await releaseLock(lockToken);
  }
}

export function competitionStateToCsv(state: CompetitionState) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const sorted = [...state.history].sort((a, b) => b.totalScore - a.totalScore);
  const header = ['排名', '序号', '选手/团队', '参赛项目', '赛道/分组', ...state.judges.map((judge) => judge.name), '总分', '平均分', '打分时间'];
  const rows = sorted.map((item, index) => [
    index + 1,
    item.contestantNumber,
    item.contestantName,
    item.contestantProject,
    item.contestantGroup,
    item.scores.judge_a,
    item.scores.judge_b,
    item.scores.judge_c,
    item.totalScore,
    item.averageScore,
    new Date(item.timestamp).toLocaleString('zh-CN'),
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(escape).join(',')).join('\n')}`;
}
