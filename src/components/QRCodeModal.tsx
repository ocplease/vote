import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, ExternalLink, X, Smartphone, Users } from 'lucide-react';
import type { Judge } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  judges: Judge[];
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, judges }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'judge_a' | 'judge_b' | 'judge_c'>('all');
  const [qrUrls, setQrUrls] = useState<{ [key: string]: string }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  useEffect(() => {
    if (!isOpen) return;

    const generateQRs = async () => {
      const keys = ['judge_a', 'judge_b', 'judge_c', 'screen', 'admin'];
      const urls: { [key: string]: string } = {};

      for (const k of keys) {
        const fullUrl = `${baseUrl}?role=${k}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(fullUrl, {
            width: 260,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          urls[k] = qrDataUrl;
        } catch (err) {
          console.error('Failed to generate QR code:', err);
        }
      }
      setQrUrls(urls);
    };

    generateQRs();
  }, [isOpen, baseUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (role: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(role);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="qr-modal-container"
        className="bg-zinc-950/95 border border-white/15 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-zinc-950/80">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight text-white uppercase">
                评委打分端扫码与远程链接
              </h2>
              <p className="text-xs text-zinc-400 font-mono tracking-wider">
                MOBILE QR CODES & REMOTE JUDGE ACCESS
              </p>
            </div>
          </div>
          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Usage Notice Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-900/90 border border-cyan-500/30 p-4 rounded-2xl flex items-start gap-3 text-cyan-200">
              <Smartphone className="w-5 h-5 flex-shrink-0 text-cyan-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white uppercase tracking-wider">手机微信 / 异地评委扫码：</div>
                <p className="text-zinc-300">
                  点击页面右上角 <strong>Share / Publish (发布或分享)</strong> 后，会生成所有人无需登录即可打开的公网链接，手机扫码即可直接打分！
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-fuchsia-500/30 p-4 rounded-2xl flex items-start gap-3 text-fuchsia-200">
              <ExternalLink className="w-5 h-5 flex-shrink-0 text-fuchsia-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white uppercase tracking-wider">本机多窗口联调测试：</div>
                <p className="text-zinc-300">
                  点击卡片中的 <strong>“在新标签页打开打分端”</strong>，或分别复制三位专家的专属链接，即可联调投票与大屏同步。
                </p>
              </div>
            </div>
          </div>

          {/* Judges QR Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {judges.map((judge) => {
              const roleUrl = `${baseUrl}?role=${judge.id}`;
              const qrImg = qrUrls[judge.id];

              return (
                <div
                  key={judge.id}
                  id={`qr-card-${judge.id}`}
                  className="bg-zinc-900/60 border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 flex flex-col items-center text-center transition-all group backdrop-blur-md"
                >
                  {/* Judge Info Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] overflow-hidden">
                      <img
                        src={judge.avatar}
                        alt={judge.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-base flex items-center gap-2">
                        {judge.shortName}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/10 uppercase">
                          专属链接
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">{judge.name}</div>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="bg-white p-3 rounded-2xl shadow-inner mb-4 flex items-center justify-center min-h-[180px] w-full max-w-[200px]">
                    {qrImg ? (
                      <img src={qrImg} alt={`QR for ${judge.shortName}`} className="w-full h-auto rounded-lg" />
                    ) : (
                      <div className="text-zinc-500 text-xs animate-pulse font-mono">生成二维码中...</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full space-y-2 mt-auto">
                    <button
                      id={`btn-copy-${judge.id}`}
                      onClick={() => copyToClipboard(judge.id, roleUrl)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-white hover:text-black active:scale-95 text-xs font-black uppercase rounded-xl transition-all border border-white/10"
                    >
                      {copiedKey === judge.id ? (
                        <>
                          <Check className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-400">链接已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-zinc-300" />
                          <span>复制专属打分链接</span>
                        </>
                      )}
                    </button>

                    <a
                      href={roleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs text-zinc-400 hover:text-cyan-300 transition-colors uppercase font-mono"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      在新标签页打开打分端
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Other Roles Quick Links */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="uppercase">其它终端快捷入口：</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`${baseUrl}?role=screen`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 uppercase font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                大屏展示端
              </a>
              <a
                href={`${baseUrl}?role=admin`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 uppercase font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-fuchsia-400" />
                后台控制台
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
