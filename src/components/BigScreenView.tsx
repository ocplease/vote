import React, { useEffect, useState, useRef } from 'react';
import {
  Trophy,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  QrCode,
  Users,
  Settings,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Radio,
  Clock,
  CheckCircle2,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import type { CompetitionState, Judge, Contestant, JudgeId } from '../types';
import {
  playHeartbeat,
  playJudgeReveal,
  playGrandTotalFanfare,
  playNextWhoosh,
  playScoreClick,
  setSoundEnabled,
  getSoundEnabled,
} from '../utils/audio';

interface BigScreenViewProps {
  state: CompetitionState;
  onSubmitScore: (judgeId: JudgeId, score: number) => void;
  onResetNext: () => void;
  onRetryCurrent: () => void;
  onOpenQRModal: () => void;
  onOpenJudgeConfig: () => void;
  onOpenScoreboard: () => void;
  onSwitchRole: (role: string) => void;
}

export const BigScreenView: React.FC<BigScreenViewProps> = ({
  state,
  onSubmitScore,
  onResetNext,
  onRetryCurrent,
  onOpenQRModal,
  onOpenJudgeConfig,
  onOpenScoreboard,
  onSwitchRole,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showSimBar, setShowSimBar] = useState(true);
  const [displayedTotal, setDisplayedTotal] = useState(0);

  const prevCompletedRef = useRef(false);
  const prevSubmittedJudgesRef = useRef<{ [key: string]: boolean }>({});

  const { currentContestant, judges, allCompleted } = state;

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Detect new judge submission to trigger reveal sound & animation
  useEffect(() => {
    judges.forEach((j) => {
      const wasSubmitted = prevSubmittedJudgesRef.current[j.id];
      if (!wasSubmitted && j.submitted) {
        // A judge just submitted!
        playJudgeReveal();
      }
      prevSubmittedJudgesRef.current[j.id] = !!j.submitted;
    });
  }, [judges]);

  // Trigger celebration when all judges complete
  useEffect(() => {
    if (allCompleted && !prevCompletedRef.current) {
      // Grand Total fanfare + confetti!
      playGrandTotalFanfare();
      triggerConfetti();

      // Animate total score count up
      const jA = judges.find((j) => j.id === 'judge_a')?.score || 0;
      const jB = judges.find((j) => j.id === 'judge_b')?.score || 0;
      const jC = judges.find((j) => j.id === 'judge_c')?.score || 0;
      const total = Number((jA + jB + jC).toFixed(2));

      let current = 0;
      const step = total / 20;
      const timer = setInterval(() => {
        current += step;
        if (current >= total) {
          setDisplayedTotal(total);
          clearInterval(timer);
        } else {
          setDisplayedTotal(Number(current.toFixed(1)));
        }
      }, 35);

      return () => clearInterval(timer);
    } else if (!allCompleted) {
      setDisplayedTotal(0);
    }
    prevCompletedRef.current = allCompleted;
  }, [allCompleted, judges]);

  // Heartbeat sound every 4 seconds while waiting if at least 1 judge has not submitted
  useEffect(() => {
    if (allCompleted) return;
    const interval = setInterval(() => {
      const anyPending = judges.some((j) => !j.submitted);
      if (anyPending) {
        playHeartbeat();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [allCompleted, judges]);

  const triggerConfetti = () => {
    try {
      // Blast left & right fireworks
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6, x: 0.2 },
        colors: ['#F59E0B', '#3B82F6', '#10B981', '#ffffff', '#EC4899'],
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6, x: 0.8 },
        colors: ['#F59E0B', '#3B82F6', '#10B981', '#ffffff', '#EC4899'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleNextWithSound = () => {
    playNextWhoosh();
    onResetNext();
  };

  // Calculate sum and average
  const jA = judges.find((j) => j.id === 'judge_a')?.score || 0;
  const jB = judges.find((j) => j.id === 'judge_b')?.score || 0;
  const jC = judges.find((j) => j.id === 'judge_c')?.score || 0;
  const grandTotal = Number((jA + jB + jC).toFixed(2));
  const grandAverage = Number((grandTotal / 3).toFixed(2));

  const submittedCount = judges.filter((j) => j.submitted).length;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Dynamic Stage Lighting Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Artistic Radial Background & Grid Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-artistic-grid"></div>
        {/* Ambient glow spots with Cyan & Fuchsia flair */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* TOP BAR: Title & Stage Controls */}
      <header className="relative z-20 px-6 py-4 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 bg-zinc-950/70 backdrop-blur-md">
        {/* Event Branding */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              {state.settings.title}
            </h1>
          </div>
          <p className="text-zinc-500 font-mono text-xs sm:text-sm mt-1 tracking-widest uppercase flex items-center gap-2">
            <span>THE ULTIMATE ARENA / GLOBAL LIVE SCORING</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold lowercase font-sans">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              live stream
            </span>
          </p>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? '关闭音效' : '开启音效'}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundOn
                ? 'bg-zinc-900 border-cyan-500/40 text-cyan-300 hover:bg-zinc-800 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundOn ? '音效已开' : '静音'}</span>
          </button>

          {/* QR Code / Remote Link */}
          <button
            id="btn-open-qr-modal"
            onClick={onOpenQRModal}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 uppercase tracking-tight"
          >
            <QrCode className="w-4 h-4" />
            <span>评委扫码 / 链接</span>
          </button>

          {/* Leaderboard Scoreboard */}
          <button
            id="btn-open-scoreboard"
            onClick={onOpenScoreboard}
            className="px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all active:scale-95 uppercase tracking-tight"
          >
            <Trophy className="w-4 h-4" />
            <span>总排行榜 ({state.history.length})</span>
          </button>

          {/* Judge Config Settings */}
          <button
            onClick={onOpenJudgeConfig}
            title="评委与头像设置"
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏展示'}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN STAGE DISPLAY */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
        {/* 1. CURRENT CONTESTANT STAGE BANNER */}
        <motion.div
          key={currentContestant.id}
          initial={{ opacity: 0, scale: 0.96, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: 'spring', damping: 20 }}
          className="relative bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Left: Contestant Profile */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Contestant Number Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] text-black font-black">
                <span className="text-[10px] font-mono uppercase tracking-widest">NO.</span>
                <span className="text-2xl sm:text-3xl font-mono leading-none">{currentContestant.number}</span>
              </div>
            </div>

            {/* Name and Project Details */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">当前参赛选手</div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                  {currentContestant.name}
                </h2>
                <span className="px-3 py-1 bg-white/10 text-cyan-300 text-xs sm:text-sm font-bold rounded-full border border-cyan-500/30 uppercase">
                  {currentContestant.group}
                </span>
              </div>
              <p className="text-sm sm:text-lg font-medium text-zinc-400 line-clamp-1">
                {currentContestant.project}
              </p>
            </div>
          </div>

          {/* Right: Scoring Progress Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!allCompleted ? (
              <div className="flex items-center gap-3.5 px-5 py-3.5 bg-zinc-950/80 border border-white/10 rounded-2xl">
                <div className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">评委打分进度</div>
                  <div className="text-sm sm:text-base font-black text-cyan-300">
                    {submittedCount} / 3 位评委已提交
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/50 rounded-2xl text-emerald-300 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="uppercase tracking-tight">全员评分完毕 · 最终成绩出炉</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 2. THE THREE JUDGE PODS (STAGE CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center">
          {judges.map((judge, index) => {
            const isDone = judge.submitted && judge.score !== null;

            // Palette configs for Artistic Flair judges
            const judgeBadgeColors =
              judge.id === 'judge_a'
                ? 'bg-cyan-500 text-black font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : judge.id === 'judge_b'
                ? 'bg-amber-400 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-fuchsia-500 text-black font-black shadow-[0_0_15px_rgba(217,70,239,0.5)]';

            const scoreDropShadow =
              judge.id === 'judge_a'
                ? 'drop-shadow-[0_5px_20px_rgba(0,240,255,0.6)]'
                : judge.id === 'judge_b'
                ? 'drop-shadow-[0_5px_20px_rgba(245,158,11,0.6)]'
                : 'drop-shadow-[0_5px_20px_rgba(255,0,255,0.6)]';

            const scoreSubLabel =
              judge.id === 'judge_a'
                ? 'text-cyan-400'
                : judge.id === 'judge_b'
                ? 'text-amber-400'
                : 'text-fuchsia-400';

            return (
              <motion.div
                key={judge.id}
                id={`judge-pod-${judge.id}`}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center min-h-[340px] sm:min-h-[380px] transition-all duration-500 overflow-hidden ${
                  isDone
                    ? 'bg-zinc-900/60 border border-white/20 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.15)] group'
                    : 'bg-zinc-900/40 border border-zinc-800/80 opacity-50 grayscale scale-95 backdrop-blur-sm'
                }`}
              >
                {/* Background Ambient Glow */}
                {isDone && (
                  <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                )}

                {/* Judge Identification Header */}
                <div className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                      {judge.shortName}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                      专家 {judge.id === 'judge_a' ? 'A' : judge.id === 'judge_b' ? 'B' : 'C'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">{judge.name}</div>
                </div>

                {/* Center Content: Hidden Suspense or White Stroke Avatar + Score */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center space-y-5">
                  <AnimatePresence mode="wait">
                    {!isDone ? (
                      /* STATE 1: WAITING / SUSPENSE RADAR */
                      <motion.div
                        key="waiting-state"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center justify-center space-y-4 py-2"
                      >
                        {/* Mystery Pulse Avatar Placeholder */}
                        <div className="relative mb-2">
                          <div className="w-32 h-32 rounded-full border-2 border-zinc-700 overflow-hidden bg-zinc-900/50 flex flex-col items-center justify-center space-y-2">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 animate-pulse"></div>
                            <div className="w-12 h-1 bg-zinc-700 rounded-full animate-pulse"></div>
                          </div>
                          <div className="absolute -bottom-2 right-0 bg-zinc-700 text-zinc-400 font-black px-3 py-1 text-xs rounded-full uppercase tracking-wider">
                            {judge.shortName}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-zinc-600 tracking-widest">
                            评分中...
                          </div>
                          <div className="text-xs text-zinc-700 font-bold uppercase tracking-tighter mt-1">
                            等待提交 · WAITING
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* STATE 2: REVEALED WHITE-STROKE AVATAR + SCORE POP-IN */
                      <motion.div
                        key="revealed-state"
                        initial={{ opacity: 0, scale: 0.4, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                        className="flex flex-col items-center justify-center space-y-4 py-2"
                      >
                        {/* WHITE OUTLINED AVATAR (Artistic Flair Spec) */}
                        <div className="relative mb-3 group">
                          {/* Blur ambient glow */}
                          <div className="absolute -inset-4 bg-white/15 rounded-full blur-xl animate-pulse"></div>
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] overflow-hidden relative z-10">
                            <img
                              src={judge.avatar}
                              alt={judge.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className={`absolute -bottom-2 right-0 ${judgeBadgeColors} px-3 py-1 text-xs rounded-full z-20 uppercase tracking-wider`}>
                            {judge.shortName}
                          </div>
                        </div>

                        {/* POPPING HIGH CONTRAST SCORE */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.15, type: 'spring', stiffness: 450, damping: 15 }}
                          className="text-center"
                        >
                          <div className={`text-6xl sm:text-7xl font-black text-white ${scoreDropShadow} font-mono tracking-tight`}>
                            {judge.score?.toFixed(judge.score % 1 === 0 ? 0 : 1)}
                          </div>
                          <div className={`text-xs ${scoreSubLabel} font-bold uppercase tracking-tighter mt-1`}>
                            已提交 · SUBMITTED
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Judge Role Footnote */}
                <div className="relative z-10 w-full text-xs text-zinc-500 truncate pt-2">
                  {judge.roleDescription}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. GRAND TOTAL HERO CARD (Artistic Flair Grand Finale Footer) */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              id="grand-total-card"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-zinc-900/60 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col md:flex-row items-center justify-between gap-8"
            >
              {/* Left: Verdict summary */}
              <div className="text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  三位评委核算完毕 · 最终成绩
                </div>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white uppercase">
                  {currentContestant.name} 选手得分
                </h3>
                <p className="text-xs sm:text-sm font-mono text-zinc-400">
                  {state.judges[0]?.name} [{jA}] + {state.judges[1]?.name} [{jB}] + {state.judges[2]?.name} [{jC}]
                </p>
              </div>

              {/* Center: Hero Total Score with high-impact drop-shadow */}
              <div className="flex items-center gap-8 sm:gap-12">
                <div className="text-center sm:text-right">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    累计总分 TOTAL SCORE
                  </div>
                  <div className="text-7xl sm:text-8xl font-black text-white tabular-nums leading-none drop-shadow-[0_0_35px_rgba(255,255,255,0.5)]">
                    {displayedTotal.toFixed(2)}
                  </div>
                </div>

                <div className="w-px h-16 bg-zinc-700 hidden sm:block"></div>

                <div className="text-center sm:text-left">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    平均得分 AVERAGE
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-cyan-300 font-mono">
                    {grandAverage.toFixed(2)}
                    <span className="text-base text-zinc-500 font-normal ml-1">/10</span>
                  </div>
                </div>
              </div>

              {/* Right: High contrast White Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                <button
                  id="btn-next-contestant"
                  onClick={handleNextWithSound}
                  className="bg-white text-black font-black py-4 px-8 rounded-xl uppercase tracking-tighter text-sm hover:bg-zinc-200 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>记录成绩 · 清空等下一个</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onRetryCurrent}
                    className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 font-bold py-2.5 px-4 rounded-xl uppercase text-xs hover:text-white hover:border-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重新打分
                  </button>
                  <button
                    onClick={onOpenScoreboard}
                    className="flex-1 bg-transparent border border-zinc-700 text-cyan-400 font-bold py-2.5 px-4 rounded-xl uppercase text-xs hover:text-white hover:border-cyan-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    总榜
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM: Direct Fast-Testing Simulator Bar */}
      <footer className="relative z-20 bg-zinc-950/90 border-t border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              快捷模拟与角色切换：
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSwitchRole('judge_a')}
                className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-cyan-400 rounded-lg text-zinc-200 hover:text-cyan-300 transition-colors"
              >
                评委 A
              </button>
              <button
                onClick={() => onSwitchRole('judge_b')}
                className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-amber-400 rounded-lg text-zinc-200 hover:text-amber-300 transition-colors"
              >
                评委 B
              </button>
              <button
                onClick={() => onSwitchRole('judge_c')}
                className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-fuchsia-400 rounded-lg text-zinc-200 hover:text-fuchsia-300 transition-colors"
              >
                评委 C
              </button>
              <button
                onClick={() => onSwitchRole('admin')}
                className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-white rounded-lg text-zinc-200 hover:text-white transition-colors"
              >
                主持人控制台
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSimBar(!showSimBar)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors font-medium"
          >
            <span>{showSimBar ? '收起单屏快捷打分器' : '展开单屏快捷打分器'}</span>
            {showSimBar ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Fast Score Buttons styled with Artistic Flair tokens */}
        {showSimBar && (
          <div className="bg-zinc-900/60 border-t border-white/10 px-6 py-4 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
                现场快速模拟打分 (点击直接更新大屏)：
              </div>
              <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                {judges.map((j) => (
                  <div key={j.id} className="flex items-center gap-1.5 text-xs">
                    <span className="font-black text-zinc-300 uppercase">{j.shortName}:</span>
                    {[7, 8, 8.5, 9, 9.5, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => {
                          playScoreClick();
                          onSubmitScore(j.id, score);
                        }}
                        className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 ${
                          j.score === score
                            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                            : 'bg-zinc-800 border border-white/10 text-zinc-300 hover:bg-white hover:text-black'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
