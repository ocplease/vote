import React, { useState } from 'react';
import { X, Save, UserCheck, RefreshCw } from 'lucide-react';
import type { Judge } from '../types';

interface JudgeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  judges: Judge[];
  onSave: (updatedJudges: Judge[]) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

export const JudgeConfigModal: React.FC<JudgeConfigModalProps> = ({
  isOpen,
  onClose,
  judges,
  onSave,
}) => {
  const [localJudges, setLocalJudges] = useState<Judge[]>(JSON.parse(JSON.stringify(judges)));

  if (!isOpen) return null;

  const handleChange = (index: number, field: keyof Judge, val: string) => {
    const next = [...localJudges];
    next[index] = { ...next[index], [field]: val };
    setLocalJudges(next);
  };

  const handleSave = () => {
    onSave(localJudges);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="judge-config-modal"
        className="bg-zinc-950/95 border border-white/15 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-zinc-950/80">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight text-white uppercase">
                评委信息与头像设置
              </h2>
              <p className="text-xs text-zinc-400 font-mono tracking-wider">
                JUDGES PROFILE & AVATAR CONFIGURATION
              </p>
            </div>
          </div>
          <button
            id="btn-close-config-modal"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {localJudges.map((judge, idx) => (
            <div
              key={judge.id}
              className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl space-y-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] overflow-hidden">
                    <img
                      src={judge.avatar}
                      alt={judge.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-black text-base text-white mr-2">{judge.shortName}</span>
                    <span className="text-xs text-zinc-400 uppercase font-mono">
                      ({judge.id === 'judge_a' ? '专家链接 A' : judge.id === 'judge_b' ? '专家链接 B' : '专家链接 C'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    专家姓名
                  </label>
                  <input
                    type="text"
                    value={judge.name}
                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white font-medium"
                    placeholder="如：陈镇"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    头衔 / 单位职责说明
                  </label>
                  <input
                    type="text"
                    value={judge.roleDescription}
                    onChange={(e) => handleChange(idx, 'roleDescription', e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white font-medium"
                    placeholder="如：学术带头人 / 资深投资人"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    头像图片链接 (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={judge.avatar}
                      onChange={(e) => handleChange(idx, 'avatar', e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-zinc-900 border border-white/15 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white font-mono"
                      placeholder="https://..."
                    />
                  </div>
                  {/* Preset quick selection */}
                  <div className="flex items-center gap-2.5 mt-3">
                    <span className="text-xs text-zinc-500 font-mono uppercase">快捷头像：</span>
                    {AVATAR_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleChange(idx, 'avatar', preset)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${judge.avatar === preset ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'border-transparent opacity-50'}`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-white/10 bg-zinc-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold uppercase text-zinc-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            id="btn-save-judge-config"
            onClick={handleSave}
            className="px-6 py-3 text-xs bg-white hover:bg-zinc-200 font-black text-black rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 transition-all active:scale-95 uppercase tracking-tight"
          >
            <Save className="w-4 h-4" />
            保存评委设置
          </button>
        </div>
      </div>
    </div>
  );
};
