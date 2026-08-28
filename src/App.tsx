import React, { useState, useEffect, useCallback } from 'react';
import type { CompetitionState, Judge, Contestant, JudgeId } from './types';
import { createDefaultState } from './defaultState';
import { BigScreenView } from './components/BigScreenView';
import { JudgeScoringView } from './components/JudgeScoringView';
import { QRCodeModal } from './components/QRCodeModal';
import { JudgeConfigModal } from './components/JudgeConfigModal';
import { AdminScoreboardModal } from './components/AdminScoreboardModal';
import { AlertCircle, Trophy, Tv } from 'lucide-react';

// Default initial state before first server sync
const defaultInitialState: CompetitionState = createDefaultState();

export default function App() {
  const [state, setState] = useState<CompetitionState>(defaultInitialState);
  const [activeRole, setActiveRole] = useState<string>('screen');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isJudgeConfigOpen, setIsJudgeConfigOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Parse URL role parameter (e.g. ?role=judge_a)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam) {
      setActiveRole(roleParam);
    }
  }, []);

  const updateRole = (role: string) => {
    setActiveRole(role);
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    window.history.pushState({}, '', url.toString());
  };

  // REST API fetch state helper
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setSyncError(null);
        // Also sync to BroadcastChannel
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('competition_channel');
            bc.postMessage({ type: 'SYNC_STATE', payload: data });
            bc.close();
          } catch {
            // Ignore channel error
          }
        }
      } else throw new Error('无法读取比赛状态');
    } catch (err) {
      console.warn('REST state fetch failed:', err);
      setSyncError(err instanceof Error ? err.message : '同步失败');
    }
  }, []);

  // BroadcastChannel for instant local cross-tab / cross-window sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('competition_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data?.payload) {
        setState(event.data.payload);
      }
    };
    return () => {
      bc.close();
    };
  }, []);

  // Vercel serverless functions do not keep WebSocket connections alive.
  // Polling keeps all expert links and the big screen synchronized reliably.
  useEffect(() => {
    fetchState();
    const pollInterval = window.setInterval(fetchState, 2000);
    return () => window.clearInterval(pollInterval);
  }, [fetchState]);

  const performAction = async (action: Record<string, unknown>) => {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '操作失败');
    setState(data.state);
    setSyncError(null);
    return data.state as CompetitionState;
  };

  // Actions
  const handleSubmitScore = async (judgeId: JudgeId, score: number) => {
    // 1. Optimistic local update
    setState((prev) => {
      const nextJudges = prev.judges.map((j) =>
        j.id === judgeId ? { ...j, score, submitted: true, submittedAt: Date.now() } : j
      );
      const allDone = nextJudges.every((j) => j.submitted && j.score !== null);
      return {
        ...prev,
        judges: nextJudges,
        allCompleted: allDone,
        lastSubmittedJudgeId: judgeId,
      };
    });

    try {
      await performAction({ type: 'submitScore', judgeId, score });
    } catch (err) {
      console.error('Score submit error:', err);
      setSyncError(err instanceof Error ? err.message : '提交评分失败');
      await fetchState();
    }
  };

  const handleResetNext = async () => {
    try {
      await performAction({ type: 'resetNext' });
    } catch (err) {
      console.error('Reset next error:', err);
      setSyncError(err instanceof Error ? err.message : '切换下一位失败');
    }
  };

  const handleRetryCurrent = async () => {
    try {
      await performAction({ type: 'retryCurrent' });
    } catch (err) {
      console.error('Retry current error:', err);
      setSyncError(err instanceof Error ? err.message : '重置评分失败');
    }
  };

  const handleUpdateCurrentContestant = async (contestant: Contestant) => {
    try {
      await performAction({ type: 'updateCurrentContestant', contestant });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : '更新当前参赛项目失败');
    }
  };

  const handleActivateContestant = async (contestantId: string) => {
    try {
      await performAction({ type: 'activateContestant', contestantId });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : '切换参赛项目失败');
    }
  };

  const handleUpdateQueue = async (queue: Contestant[]) => {
    try {
      await performAction({ type: 'updateQueue', queue });
    } catch (err) {
      console.error('Update queue error:', err);
      setSyncError(err instanceof Error ? err.message : '更新候场队列失败');
    }
  };

  const handleSaveJudges = async (updatedJudges: Judge[]) => {
    try {
      await performAction({ type: 'updateJudges', judges: updatedJudges });
    } catch (err) {
      console.error('Save judges error:', err);
      setSyncError(err instanceof Error ? err.message : '保存专家失败');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await performAction({ type: 'deleteHistory', id });
    } catch (err) {
      console.error('Delete history error:', err);
      setSyncError(err instanceof Error ? err.message : '删除成绩失败');
    }
  };

  const handleClearHistory = async () => {
    try {
      await performAction({ type: 'clearHistory' });
    } catch (err) {
      console.error('Clear history error:', err);
      setSyncError(err instanceof Error ? err.message : '清空成绩失败');
    }
  };

  // Render appropriate view according to activeRole
  const renderCurrentView = () => {
    // Judge Views
    if (activeRole === 'judge_a' || activeRole === 'judge_b' || activeRole === 'judge_c') {
      const currentJudge = state.judges.find((j) => j.id === activeRole) || state.judges[0];
      return (
        <JudgeScoringView
          currentJudge={currentJudge}
          state={state}
          onSubmitScore={handleSubmitScore}
          onSwitchRole={updateRole}
        />
      );
    }

    // Host Admin View (direct standalone or embedded)
    if (activeRole === 'admin') {
      return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 bg-artistic-radial relative">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl font-black italic uppercase">主持人 / 裁判长后台</h1>
              </div>
              <button
                onClick={() => updateRole('screen')}
                className="px-4 py-2 bg-white text-black font-black uppercase text-xs rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 hover:bg-zinc-200"
              >
                <Tv className="w-4 h-4" />
                前往大屏展示端
              </button>
            </div>

            <AdminScoreboardModal
              isOpen={true}
              onClose={() => updateRole('screen')}
              state={state}
              onResetNext={handleResetNext}
              onRetryCurrent={handleRetryCurrent}
              onUpdateCurrentContestant={handleUpdateCurrentContestant}
              onActivateContestant={handleActivateContestant}
              onDeleteHistory={handleDeleteHistory}
              onClearHistory={handleClearHistory}
              onUpdateQueue={handleUpdateQueue}
            />
          </div>
        </div>
      );
    }

    // Default: Main Stage Big Screen View
    return (
      <BigScreenView
        state={state}
        onSubmitScore={handleSubmitScore}
        onResetNext={handleResetNext}
        onRetryCurrent={handleRetryCurrent}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenJudgeConfig={() => setIsJudgeConfigOpen(true)}
        onOpenScoreboard={() => setIsScoreboardOpen(true)}
        onSwitchRole={updateRole}
      />
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white select-none">
      {syncError && (
        <div className="fixed left-1/2 top-3 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/95 px-4 py-2 text-sm text-red-100 shadow-2xl">
          <AlertCircle className="h-4 w-4" />
          {syncError}
        </div>
      )}
      {renderCurrentView()}

      {/* Modals for Big Screen */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        judges={state.judges}
      />

      <JudgeConfigModal
        isOpen={isJudgeConfigOpen}
        onClose={() => setIsJudgeConfigOpen(false)}
        judges={state.judges}
        onSave={handleSaveJudges}
      />

      <AdminScoreboardModal
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        state={state}
        onResetNext={handleResetNext}
        onRetryCurrent={handleRetryCurrent}
        onUpdateCurrentContestant={handleUpdateCurrentContestant}
        onActivateContestant={handleActivateContestant}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
        onUpdateQueue={handleUpdateQueue}
      />
    </div>
  );
}
