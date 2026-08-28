import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Send,
  RotateCcw,
  Tv,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Judge, CompetitionState, JudgeId } from '../types';
import { playScoreClick, playJudgeReveal } from '../utils/audio';

interface JudgeScoringViewProps {
  currentJudge: Judge;
  state: CompetitionState;
  onSubmitScore: (judgeId: JudgeId, score: number) => void;
  onSwitchRole: (role: string) => void;
}

const SCORE_LABELS: { [key: number]: string } = {
  10: '🌟 完美绝伦 / 顶级表现',
  9: '✨ 卓越出众 / 表现亮眼',
  8: '👍 良好发挥 / 结构完整',
  7: '⚖️ 中规中矩 / 符合预期',
  6: '⚠️ 刚达及格标准',
  5: '📉 需进一步完善',
};

const SCORE_OPTIONS = [5, 6, 7, 8, 9, 10] as const;

export const JudgeScoringView: React.FC<JudgeScoringViewProps> = ({
  currentJudge,
  state,
  onSubmitScore,
  onSwitchRole,
}) => {
  const [selectedScore, setSelectedScore] = useState<number>(currentJudge.score || 9);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Sync selected score when judge score in state changes
  useEffect(() => {
    setSelectedScore(currentJudge.score ?? 9);
    setIsEditing(false);
  }, [currentJudge.score, state.currentContestant.id]);

  const contestant = state.currentContestant;
  const isSubmitted = currentJudge.submitted && currentJudge.score !== null;
  const isLocked = isSubmitted && !isEditing;

  // Handle score selection
  const handleSelectScore = (val: number) => {
    if (isLocked) return;
    setSelectedScore(val);
    playScoreClick(val >= 9 ? 1.2 : 1.0);
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  // Handle lock in & submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    playJudgeReveal();
    if ('vibrate' in navigator) {
      navigator.vibrate([40, 60, 80]);
    }
    onSubmitScore(currentJudge.id, selectedScore);
    setIsEditing(false);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const handleEditScore = () => {
    setIsEditing(true);
  };

  // Count how many judges submitted
  const submittedCount = state.judges.filter((j) => j.submitted).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white bg-artistic-radial relative flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto selection:bg-cyan-500 overflow-hidden font-sans">
      {/* Background grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-artistic-grid"></div>

      {/* Top Bar with Judge Profile */}
      <div className="relative z-10 space-y-4">
        <header className="flex items-center justify-between bg-zinc-900/70 border border-white/10 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] overflow-hidden">
                <img
                  src={currentJudge.avatar}
                  alt={currentJudge.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-wide">{currentJudge.shortName}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/10 font-bold uppercase">
                  专属打分端
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[180px]">{currentJudge.name} · {currentJudge.roleDescription}</p>
            </div>
          </div>

          {/* Switch Role / Big Screen Shortcut */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSwitchRole('screen')}
              title="切换至大屏展示端"
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs flex items-center gap-1 transition-colors border border-white/5 font-bold uppercase"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">大屏</span>
            </button>
          </div>
        </header>

        {/* Current Contestant Card */}
        <motion.div
          key={contestant.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 border-b border-l border-cyan-500/30 rounded-bl-2xl text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
            评分中 · SCORING
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex-shrink-0 flex items-center justify-center font-mono font-black text-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              #{contestant.number}
            </div>
            <div className="flex-1 min-w-0 pr-16">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">当前选手</div>
              <h2 className="text-xl font-black text-white tracking-wide truncate">{contestant.name}</h2>
              <p className="text-sm text-zinc-300 font-medium line-clamp-1 mt-0.5">{contestant.project}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 bg-white/10 text-cyan-300 rounded-full font-bold uppercase border border-cyan-500/20">
                  {contestant.group}
                </span>
                <span className="text-xs text-zinc-400 font-mono">满分 10.0 分</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Scoring Area */}
      <div className="relative z-10 my-auto py-4 space-y-6">
        {/* Score Value Preview */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-bold mb-1">
              {isLocked ? '您提交的最终打分 SUBMITTED' : isEditing ? '修改分值后重新提交' : '点击分值打分 (评分中)'}
            </div>
            <motion.div
              key={selectedScore}
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-baseline gap-1.5"
            >
              <span className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white drop-shadow-[0_5px_20px_rgba(0,240,255,0.4)]">
                {selectedScore.toFixed(selectedScore % 1 === 0 ? 0 : 1)}
              </span>
              <span className="text-2xl font-black text-zinc-500">/ 10</span>
            </motion.div>
            <div className="text-xs sm:text-sm font-bold text-cyan-300 mt-2 px-4 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 uppercase tracking-wide">
              {SCORE_LABELS[selectedScore] || '✨ 专业评分'}
            </div>
          </div>
        </div>

        {/* 5 - 10 integer score pad */}
        <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">分值选项板</span>
            <span className="text-xs text-cyan-300 font-mono">仅限 5–10 整数分</span>
          </div>

          {/* Main Integer Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
            {SCORE_OPTIONS.map((score) => {
              const isSelected = selectedScore === score;
              return (
                <button
                  key={score}
                  id={`score-btn-${score}`}
                  onClick={() => handleSelectScore(score)}
                  disabled={isLocked}
                  className={`relative py-4 rounded-xl font-black text-xl font-mono transition-all transform active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'bg-white text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-105'
                      : isLocked
                      ? 'bg-zinc-800/40 text-zinc-600 border border-zinc-800'
                      : 'bg-zinc-800 border border-white/10 text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {score}
                  {score === 10 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Live Status indicator */}
        <div className="flex items-center justify-between text-xs text-zinc-400 px-2 font-mono">
          <span className="uppercase">打分同步状态：</span>
          <span className="font-bold text-cyan-300">
            {submittedCount} / 3 位评委已评完
          </span>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="relative z-10 space-y-3 pt-2">
        <AnimatePresence mode="wait">
          {!isLocked ? (
            <motion.button
              key="submit-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="btn-submit-score"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-white text-black font-black py-4 px-8 rounded-xl uppercase tracking-tighter text-base hover:bg-zinc-200 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>提交分数 ({selectedScore} 分)</span>
            </motion.button>
          ) : (
            <motion.div
              key="submitted-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 bg-zinc-900/90 border border-cyan-500/40 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col items-center text-center space-y-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-cyan-300 font-black text-base uppercase tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span>评分已锁定并实时同步至大屏幕</span>
              </div>
              <p className="text-xs text-zinc-400">
                大屏正在展示您的白色描边头像与实时得分，待全员评分后将公布总成绩
              </p>
              {!state.allCompleted && (
                <button
                  onClick={handleEditScore}
                  className="text-xs text-zinc-400 hover:text-white underline flex items-center gap-1 pt-1 font-bold uppercase"
                >
                  <RotateCcw className="w-3 h-3" />
                  修改重新提交
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
