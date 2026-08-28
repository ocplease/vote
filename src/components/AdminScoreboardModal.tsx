import React, { useState } from 'react';
import {
  Trophy,
  X,
  Download,
  Trash2,
  Plus,
  ArrowUpDown,
  Users,
  Play,
  RotateCcw,
  FileSpreadsheet,
  FileDown,
  Pencil,
  Upload,
} from 'lucide-react';
import type { CompetitionState, Contestant } from '../types';

interface AdminScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CompetitionState;
  onResetNext: () => void;
  onRetryCurrent: () => void;
  onUpdateCurrentContestant: (contestant: Contestant) => void;
  onActivateContestant: (contestantId: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  onUpdateQueue: (queue: Contestant[]) => void;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function contestantsFromCsv(text: string): Contestant[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const aliases = {
    number: ['编号', '序号', 'number', 'id'],
    name: ['选手', '选手/团队', '选手姓名', '团队', '团队名称', 'name'],
    project: ['参赛项目', '项目', '项目名称', '作品', 'project'],
    group: ['赛道/分组', '赛道', '分组', '组别', 'group'],
  };
  const header = rows[0].map((value) => value.toLowerCase().replace(/\s/g, ''));
  const findColumn = (keys: string[]) => header.findIndex((value) => keys.some((key) => value === key.toLowerCase().replace(/\s/g, '')));
  const indexes = {
    number: findColumn(aliases.number),
    name: findColumn(aliases.name),
    project: findColumn(aliases.project),
    group: findColumn(aliases.group),
  };
  const hasHeader = indexes.name >= 0 || indexes.project >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map((values, index) => {
    const get = (field: keyof typeof indexes, fallback: number) => values[indexes[field] >= 0 ? indexes[field] : fallback]?.trim() || '';
    return {
      id: `c-import-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      number: get('number', 0) || String(index + 1).padStart(2, '0'),
      name: get('name', 1),
      project: get('project', 2),
      group: get('group', 3) || '创新赛道',
    };
  }).filter((item) => item.name && item.project);
}

export const AdminScoreboardModal: React.FC<AdminScoreboardModalProps> = ({
  isOpen,
  onClose,
  state,
  onResetNext,
  onRetryCurrent,
  onUpdateCurrentContestant,
  onActivateContestant,
  onDeleteHistory,
  onClearHistory,
  onUpdateQueue,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'queue' | 'addContestant'>('leaderboard');
  const [sortBy, setSortBy] = useState<'rank' | 'time'>('rank');

  // New contestant form state
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newGroup, setNewGroup] = useState('创新赛道');
  const [editingTarget, setEditingTarget] = useState<'current' | number | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [importPreview, setImportPreview] = useState<Contestant[]>([]);
  const [importMessage, setImportMessage] = useState('');

  if (!isOpen) return null;

  const sortedHistory = [...state.history].sort((a, b) => {
    if (sortBy === 'rank') {
      return b.totalScore - a.totalScore;
    }
    return b.timestamp - a.timestamp;
  });

  const handleAddContestant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newContestant: Contestant = {
      id: `c-${Date.now()}`,
      number: newNumber.trim() || `${state.queue.length + state.history.length + 1}`.padStart(2, '0'),
      name: newName.trim(),
      project: newProject.trim() || '参赛项目展示',
      group: newGroup.trim() || '创新赛道',
    };

    onUpdateQueue([...state.queue, newContestant]);
    setNewName('');
    setNewNumber('');
    setNewProject('');
    setActiveTab('queue');
  };

  const handleExportCSV = () => {
    window.open('/api/export', '_blank');
  };

  const handleRemoveQueueItem = (index: number) => {
    const updated = state.queue.filter((_, i) => i !== index);
    onUpdateQueue(updated);
  };

  const startEditing = (target: 'current' | number, contestant: Contestant) => {
    setEditingTarget(target);
    setEditingContestant({ ...contestant });
  };

  const saveEditing = () => {
    if (!editingContestant?.name.trim() || !editingContestant.project.trim()) return;
    if (editingTarget === 'current') onUpdateCurrentContestant(editingContestant);
    else if (typeof editingTarget === 'number') {
      onUpdateQueue(state.queue.map((item, index) => index === editingTarget ? editingContestant : item));
    }
    setEditingTarget(null);
    setEditingContestant(null);
  };

  const handleCsvFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = contestantsFromCsv(await file.text());
      setImportPreview(parsed);
      setImportMessage(parsed.length ? `已识别 ${parsed.length} 个有效参赛项目，请确认后导入。` : '未识别到有效项目，请检查表头和必填字段。');
    } catch {
      setImportPreview([]);
      setImportMessage('CSV 文件读取失败，请重新选择。');
    }
  };

  const importContestants = () => {
    if (!importPreview.length) return;
    onUpdateQueue([...state.queue, ...importPreview]);
    setImportMessage(`已将 ${importPreview.length} 个参赛项目加入候场队列。`);
    setImportPreview([]);
    setActiveTab('queue');
  };

  const downloadTemplate = () => {
    const content = '\uFEFF编号,选手/团队,参赛项目,赛道/分组\n01,示例团队,示例参赛项目,创新赛道';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '参赛项目批量导入模板.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="admin-modal-container"
        className="bg-zinc-950/95 border border-white/15 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-zinc-950/80">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight text-white uppercase">
                比赛成绩总榜与赛事控制台
              </h2>
              <p className="text-xs text-zinc-400 font-mono tracking-wider">
                LEADERBOARD MANAGEMENT & CONTESTANT QUEUE
              </p>
            </div>
          </div>
          <button
            id="btn-close-admin-modal"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-white/10 bg-zinc-900/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Trophy className="w-4 h-4 text-cyan-400" />
              总成绩排行榜 ({state.history.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'queue'
                  ? 'border-fuchsia-400 text-fuchsia-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4 text-fuchsia-400" />
              待出场队列 ({state.queue.length})
            </button>
            <button
              onClick={() => setActiveTab('addContestant')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'addContestant'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              添加参赛选手
            </button>
          </div>

          {activeTab === 'leaderboard' && state.history.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => setSortBy(sortBy === 'rank' ? 'time' : 'rank')}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs text-zinc-300 flex items-center gap-1.5 transition-colors font-bold"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                {sortBy === 'rank' ? '按总分排序' : '按出场时间'}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-white text-black font-black hover:bg-zinc-200 rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all uppercase tracking-tight"
              >
                <Download className="w-3.5 h-3.5" />
                导出 CSV 成绩表
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {editingContestant && editingTarget !== null && (
            <div className="mb-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-cyan-200">编辑{editingTarget === 'current' ? '当前' : '候场'}参赛项目</h3>
                <button onClick={() => setEditingContestant(null)} className="text-xs text-zinc-400 hover:text-white">取消</button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {(['number', 'name', 'project', 'group'] as const).map((field) => (
                  <input
                    key={field}
                    value={editingContestant[field]}
                    onChange={(event) => setEditingContestant({ ...editingContestant, [field]: event.target.value })}
                    placeholder={{ number: '编号', name: '选手/团队', project: '参赛项目', group: '赛道/分组' }[field]}
                    className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={saveEditing} className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-black hover:bg-cyan-300">
                  保存修改
                </button>
              </div>
            </div>
          )}
          {/* TAB 1: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div>
              {state.history.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium text-slate-400">暂无已打分选手的成绩记录</p>
                  <p className="text-xs text-slate-500 mt-1">当评委完成打分后，成绩将自动记录并实时更新榜单</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40">
                    <table className="w-full text-left text-sm text-zinc-300">
                      <thead className="bg-zinc-950/80 text-xs uppercase text-zinc-400 border-b border-white/10 font-mono tracking-wider">
                        <tr>
                          <th className="px-4 py-3.5 text-center">排名</th>
                          <th className="px-4 py-3.5">序号 / 选手</th>
                          <th className="px-4 py-3.5">参赛项目</th>
                          <th className="px-3 py-3.5 text-center text-cyan-400">{state.judges[0]?.name}</th>
                          <th className="px-3 py-3.5 text-center text-amber-400">{state.judges[1]?.name}</th>
                          <th className="px-3 py-3.5 text-center text-fuchsia-400">{state.judges[2]?.name}</th>
                          <th className="px-4 py-3.5 text-center font-black text-white">总分 (30分)</th>
                          <th className="px-4 py-3.5 text-center">均分</th>
                          <th className="px-4 py-3.5 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedHistory.map((item, idx) => {
                          const rank = idx + 1;
                          let rankBadge = (
                            <span className="inline-block w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs leading-6 font-bold text-center">
                              {rank}
                            </span>
                          );
                          if (sortBy === 'rank') {
                            if (rank === 1) {
                              rankBadge = (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                  1
                                </span>
                              );
                            } else if (rank === 2) {
                              rankBadge = (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-black shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                                  2
                                </span>
                              );
                            } else if (rank === 3) {
                              rankBadge = (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/20">
                                  3
                                </span>
                              );
                            }
                          }

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-zinc-800/40 transition-colors"
                            >
                              <td className="px-4 py-3 text-center">{rankBadge}</td>
                              <td className="px-4 py-3">
                                <div className="font-black text-white flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono border border-white/10">
                                    #{item.contestantNumber}
                                  </span>
                                  {item.contestantName}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono mt-0.5">{item.contestantGroup}</div>
                              </td>
                              <td className="px-4 py-3 text-zinc-300 max-w-[220px] truncate" title={item.contestantProject}>
                                {item.contestantProject}
                              </td>
                              <td className="px-3 py-3 text-center font-mono font-bold text-cyan-400">
                                {item.scores.judge_a.toFixed(1)}
                              </td>
                              <td className="px-3 py-3 text-center font-mono font-bold text-amber-400">
                                {item.scores.judge_b.toFixed(1)}
                              </td>
                              <td className="px-3 py-3 text-center font-mono font-bold text-fuchsia-400">
                                {item.scores.judge_c.toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-lg font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                  {item.totalScore.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-cyan-300">
                                {item.averageScore.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => onDeleteHistory(item.id)}
                                  title="删除该记录"
                                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-3 text-xs text-zinc-500 font-mono">
                    <span>共 {state.history.length} 条有效打分记录</span>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要清空所有比赛成绩记录吗？此操作无法撤销。')) {
                          onClearHistory();
                        }
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors uppercase font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清空全部成绩记录
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black flex items-center justify-center font-black text-sm">
                    当前
                  </div>
                  <div>
                    <div className="font-black text-white flex items-center gap-2 text-base">
                      <span className="font-mono">#{state.currentContestant.number}</span>
                      <span>{state.currentContestant.name}</span>
                      <span className="text-xs px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-bold uppercase border border-cyan-500/30">
                        正在展示 / 评分中
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">{state.currentContestant.project}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing('current', state.currentContestant)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-xl font-bold text-zinc-300 flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    编辑项目
                  </button>
                  <button
                    onClick={onRetryCurrent}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-xl font-bold text-zinc-300 flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重置当前打分
                  </button>
                  <button
                    onClick={onResetNext}
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-xs rounded-xl font-black text-black flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase"
                  >
                    <Play className="w-3.5 h-3.5" />
                    下一位选手
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">后续候场选手 ({state.queue.length})</h3>
                {state.queue.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-sm">
                    队列中暂无候场选手，可前往「添加参赛选手」批量录入
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/40">
                    {state.queue.map((contestant, idx) => (
                      <div
                        key={contestant.id}
                        className="p-3.5 bg-zinc-900/60 hover:bg-zinc-800 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-zinc-500">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-white/10">
                            #{contestant.number}
                          </span>
                          <div>
                            <span className="font-bold text-white mr-2">{contestant.name}</span>
                            <span className="text-xs text-zinc-400">{contestant.project}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(idx, contestant)}
                            className="p-1.5 text-zinc-400 hover:text-cyan-300 rounded transition-colors"
                            title="编辑项目"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onActivateContestant(contestant.id)}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs transition-colors uppercase"
                          >
                            立即上场
                          </button>
                          <button
                            onClick={() => handleRemoveQueueItem(idx)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Add Contestant */}
          {activeTab === 'addContestant' && (
            <div className="mx-auto max-w-3xl space-y-8 py-4">
            <form onSubmit={handleAddContestant} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Plus className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-black">单个添加参赛项目</h3>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  选手编号 / 序号
                </label>
                <input
                  type="text"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="如：06 或 A-01"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  选手姓名 / 团队名称 <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="如：张三团队"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  参赛作品 / 项目名称
                </label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="如：《基于深度学习的多模态识别系统》"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  赛道 / 分组
                </label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  placeholder="如：科技创新组 / 青年先锋赛道"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-white hover:bg-zinc-200 text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 transition-all active:scale-95 uppercase tracking-tight"
                >
                  <Plus className="w-4 h-4" />
                  确认加入候场队列
                </button>
              </div>
            </form>
            <div className="space-y-4 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black"><FileSpreadsheet className="h-4 w-4 text-fuchsia-400" />CSV 批量上传</h3>
                  <p className="mt-1 text-xs text-zinc-400">支持表头：编号、选手/团队、参赛项目、赛道/分组；选手/团队和参赛项目为必填。</p>
                </div>
                <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white">
                  <FileDown className="h-4 w-4" />下载 CSV 模板
                </button>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-fuchsia-400/50 bg-zinc-900/60 px-5 py-8 text-sm font-bold text-fuchsia-200 hover:bg-zinc-900">
                <Upload className="h-5 w-5" />选择 CSV 文件
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleCsvFile(event.target.files?.[0])} />
              </label>
              {importMessage && <p className="text-xs text-zinc-300">{importMessage}</p>}
              {importPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="max-h-48 overflow-auto rounded-xl border border-white/10">
                    {importPreview.slice(0, 20).map((item) => (
                      <div key={item.id} className="grid grid-cols-[60px_1fr_2fr_1fr] gap-2 border-b border-white/5 px-3 py-2 text-xs last:border-0">
                        <span className="font-mono text-zinc-400">#{item.number}</span><span>{item.name}</span><span className="text-zinc-300">{item.project}</span><span className="text-zinc-500">{item.group}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={importContestants} className="flex items-center gap-2 rounded-xl bg-fuchsia-400 px-5 py-2.5 text-xs font-black text-black hover:bg-fuchsia-300">
                      <Upload className="h-4 w-4" />确认导入 {importPreview.length} 个项目
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
