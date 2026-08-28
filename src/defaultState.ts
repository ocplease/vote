import type { CompetitionState, Contestant, Judge } from './types';

export const defaultContestants: Contestant[] = [
  {
    id: 'c-01',
    number: '01',
    name: '林浩然',
    project: '《灵犀AI手语双向实时同传系统》',
    group: '科技创新赛道',
  },
  {
    id: 'c-02',
    number: '02',
    name: '苏语晨',
    project: '《星河自适应柔性光伏聚能翼》',
    group: '新能源与未来工程',
  },
  {
    id: 'c-03',
    number: '03',
    name: '张宇翔团队',
    project: '《深蓝远洋智能微型探测集群》',
    group: '智能制造与海洋科技',
  },
  {
    id: 'c-04',
    number: '04',
    name: '陈美琦',
    project: '《仿生神经触觉反馈智能义肢》',
    group: '生物医疗与大健康',
  },
  {
    id: 'c-05',
    number: '05',
    name: '赵子轩',
    project: '《城市低空飞行物流协同大脑》',
    group: '智慧交通与低空经济',
  },
];

export const defaultJudges: Judge[] = [
  {
    id: 'judge_a',
    name: '陈镇',
    shortName: '产品专家',
    roleDescription: '产品专家',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    color: '#3B82F6',
    score: null,
    submitted: false,
    submittedAt: null,
    isOnline: true,
  },
  {
    id: 'judge_b',
    name: '丛露微',
    shortName: '研发专家',
    roleDescription: '研发专家',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    color: '#10B981',
    score: null,
    submitted: false,
    submittedAt: null,
    isOnline: true,
  },
  {
    id: 'judge_c',
    name: '黄晓华',
    shortName: '业务专家',
    roleDescription: '业务专家',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    color: '#F59E0B',
    score: null,
    submitted: false,
    submittedAt: null,
    isOnline: true,
  },
];

export function createDefaultState(): CompetitionState {
  return {
    currentContestant: { ...defaultContestants[0] },
    judges: defaultJudges.map((judge) => ({ ...judge })),
    allCompleted: false,
    history: [],
    queue: defaultContestants.slice(1).map((contestant) => ({ ...contestant })),
    settings: {
      soundEnabled: true,
      scoreStep: 1,
      scoringScaleMax: 10,
      showJudgeScoreInstantly: true,
      title: '2026 全国青年创新创业大赛 - 决赛打分现场',
    },
    lastUpdated: Date.now(),
    lastSubmittedJudgeId: null,
  };
}
