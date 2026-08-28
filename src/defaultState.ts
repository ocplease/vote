import type { CompetitionState, Contestant, Judge } from './types.js';

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
    avatar: '/avatars/chen-zhen.webp',
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
    avatar: '/avatars/cong-luwei.webp',
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
    avatar: '/avatars/huang-xiaohua.webp',
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
      title: '内容平台2026 SKILLATHON总决赛',
    },
    lastUpdated: Date.now(),
    lastSubmittedJudgeId: null,
  };
}
