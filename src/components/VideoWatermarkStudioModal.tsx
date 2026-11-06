import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

type DelogoAlgo = 'patch' | 'blur' | 'interpolate' | 'vignette';
type ViewMode = 'processed' | 'split' | 'original';

export const VideoWatermarkStudioModal: React.FC<Props> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 비디오 재생 상태
  const [videoSrc, setVideoSrc] = useState<string>('assets/citadel_bonfire.mp4');
  const [videoName, setVideoName] = useState<string>('citadel_bonfire.mp4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoResolution, setVideoResolution] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // 워터마크 영역 & 알고리즘 파라미터
  const [algo, setAlgo] = useState<DelogoAlgo>('patch');
  const [patchDir, setPatchDir] = useState<'top' | 'left'>('top');
  const [wPct, setWPct] = useState<number>(16);
  const [hPct, setHPct] = useState<number>(8);
  const [mrPct, setMrPct] = useState<number>(2);
  const [mbPct, setMbPct] = useState<number>(2);
  const [feather, setFeather] = useState<number>(14);

  // 뷰어 설정
  const [viewMode, setViewMode] = useState<ViewMode>('processed');
  const [showBox, setShowBox] = useState<boolean>(true);

  // 비디오 내보내기 진행 상태
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  const animFrameRef = useRef<number | null>(null);

  // ── 비디오 로드 ──
  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (!v) return;

    const handleLoadedMetadata = () => {
      setDuration(v.duration || 0);
      setVideoResolution({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
      if (canvasRef.current) {
        canvasRef.current.width = v.videoWidth || 1280;
        canvasRef.current.height = v.videoHeight || 720;
      }
      v.currentTime = 0.05;
    };

    const handleSeeked = () => {
      renderCurrentFrame();
    };

    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    v.addEventListener('seeked', handleSeeked);

    return () => {
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
      v.removeEventListener('seeked', handleSeeked);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [open, videoSrc]);

  // ── 렌더 루프 ──
  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        const v = videoRef.current;
        if (v && !v.paused && !v.ended) {
          renderCurrentFrame();
          setCurrentTime(v.currentTime);
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isPlaying, algo, patchDir, wPct, hPct, mrPct, mbPct, feather, viewMode, showBox]);

  // 파라미터 변경 시 정지 화면 즉시 다시 렌더링
  useEffect(() => {
    if (!isPlaying) {
      renderCurrentFrame();
    }
  }, [algo, patchDir, wPct, hPct, mrPct, mbPct, feather, viewMode, showBox]);

  const renderCurrentFrame = (overrideShowBox?: boolean, overrideViewMode?: ViewMode) => {
    const v = videoRef.current;
    const cvs = canvasRef.current;
    if (!v || !cvs || cvs.width === 0 || cvs.height === 0) return;

    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = cvs.width;
    const H = cvs.height;

    const bw = Math.round(W * (wPct / 100));
    const bh = Math.round(H * (hPct / 100));
    const mr = Math.round(W * (mrPct / 100));
    const mb = Math.round(H * (mbPct / 100));
    const bx = W - bw - mr;
    const by = H - bh - mb;

    const currentMode = overrideViewMode !== undefined ? overrideViewMode : viewMode;
    const shouldDrawBox = overrideShowBox !== undefined ? overrideShowBox : showBox;

    // 1. 원본 비디오 그리기
    ctx.save();
    ctx.drawImage(v, 0, 0, W, H);

    // 2. 워터마크 제거 알고리즘 합성
    if (currentMode !== 'original') {
      applyDelogo(ctx, v, W, H, bx, by, bw, bh, feather, algo, patchDir);
    }

    // 3. 분할 비교 (Split Slider)
    if (currentMode === 'split') {
      const splitX = Math.round(W / 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, H);
      ctx.clip();
      ctx.drawImage(v, 0, 0, W, H);
      ctx.restore();

      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText('◀ 원본', splitX - 70, 30);
      ctx.fillStyle = '#00d2ff';
      ctx.fillText('제거 후 ▶', splitX + 20, 30);
    }

    // 4. 바운딩 박스 표시
    if (shouldDrawBox) {
      ctx.save();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(bx - 3, by - 3, 6, 6);
      ctx.fillRect(bx + bw - 3, by - 3, 6, 6);
      ctx.fillRect(bx - 3, by + bh - 3, 6, 6);
      ctx.fillRect(bx + bw - 3, by + bh - 3, 6, 6);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#00d2ff';
      ctx.fillText('Watermark Mask', bx, Math.max(16, by - 6));
      ctx.restore();
    }

    ctx.restore();
  };

  const applyDelogo = (
    targetCtx: CanvasRenderingContext2D,
    videoEl: HTMLVideoElement,
    W: number,
    H: number,
    x: number,
    y: number,
    w: number,
    h: number,
    f: number,
    mode: DelogoAlgo,
    dir: 'top' | 'left'
  ) => {
    if (w <= 0 || h <= 0) return;

    if (mode === 'patch') {
      const patchCanvas = document.createElement('canvas');
      patchCanvas.width = w;
      patchCanvas.height = h;
      const pCtx = patchCanvas.getContext('2d');
      if (!pCtx) return;

      const sx = dir === 'left' ? Math.max(0, x - w) : x;
      const sy = dir === 'top' ? Math.max(0, y - h) : y;

      pCtx.drawImage(videoEl, sx, sy, w, h, 0, 0, w, h);

      if (f > 4) {
        pCtx.filter = `blur(${Math.min(3, f * 0.2)}px)`;
        pCtx.drawImage(patchCanvas, 0, 0);
        pCtx.filter = 'none';
      }

      pCtx.globalCompositeOperation = 'destination-in';
      const grad = pCtx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * 0.55);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.7, 'rgba(0,0,0,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, w, h);

      targetCtx.save();
      targetCtx.drawImage(patchCanvas, x, y);
      targetCtx.restore();

    } else if (mode === 'blur') {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(x, y, w, h);
      targetCtx.clip();
      targetCtx.filter = `blur(${Math.max(6, f)}px)`;
      targetCtx.drawImage(videoEl, 0, 0, W, H);
      targetCtx.restore();

    } else if (mode === 'interpolate') {
      try {
        const imgData = targetCtx.getImageData(x, y, w, h);
        const data = imgData.data;
        const topPixels = targetCtx.getImageData(x, Math.max(0, y - 2), w, 1).data;
        const leftPixels = targetCtx.getImageData(Math.max(0, x - 2), y, 1, h).data;

        for (let row = 0; row < h; row++) {
          const ty = row / h;
          const lr = leftPixels[row * 4];
          const lg = leftPixels[row * 4 + 1];
          const lb = leftPixels[row * 4 + 2];

          for (let col = 0; col < w; col++) {
            const tx = col / w;
            const tr = topPixels[col * 4];
            const tg = topPixels[col * 4 + 1];
            const tb = topPixels[col * 4 + 2];

            const idx = (row * w + col) * 4;
            data[idx]     = Math.round(lr * (1 - tx) + tr * tx);
            data[idx + 1] = Math.round(lg * (1 - tx) + tg * tx);
            data[idx + 2] = Math.round(lb * (1 - tx) + tb * tx);
          }
        }
        targetCtx.putImageData(imgData, x, y);
      } catch (_) {}

    } else if (mode === 'vignette') {
      targetCtx.save();
      const grad = targetCtx.createRadialGradient(x + w, y + h, 5, x + w, y + h, Math.max(w, h) * 1.5);
      grad.addColorStop(0, 'rgba(7, 8, 13, 0.95)');
      grad.addColorStop(0.5, 'rgba(7, 8, 13, 0.7)');
      grad.addColorStop(1, 'rgba(7, 8, 13, 0)');
      targetCtx.fillStyle = grad;
      targetCtx.fillRect(x - f, y - f, w + f * 2, h + f * 2);
      targetCtx.restore();
    }
  };

  const handlePlayToggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const target = (parseFloat(e.target.value) / 100) * duration;
    v.currentTime = target;
    setCurrentTime(target);
    renderCurrentFrame();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
      setIsPlaying(false);
    }
  };

  const handleCaptureFrame = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    renderCurrentFrame(false, 'processed');
    const a = document.createElement('a');
    a.href = cvs.toDataURL('image/png');
    a.download = `${videoName.replace(/\.[^/.]+$/, '')}_frame_${Math.round(currentTime * 1000)}.png`;
    a.click();
    renderCurrentFrame();
  };

  const handleExportVideo = async () => {
    const v = videoRef.current;
    const cvs = canvasRef.current;
    if (!v || !cvs || !duration) return;

    setIsExporting(true);
    setIsPlaying(false);
    v.pause();
    v.currentTime = 0;

    const stream = cvs.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10000000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${videoName.replace(/\.[^/.]+$/, '')}_clean.${ext}`;
      a.click();

      setIsExporting(false);
      setExportStatusText('✅ 내보내기 완료!');
      renderCurrentFrame();
    };

    recorder.start();

    const fps = 30;
    const totalSteps = Math.ceil(duration * fps);
    const stepTime = 1 / fps;

    for (let i = 0; i < totalSteps; i++) {
      v.currentTime = i * stepTime;
      await new Promise<void>((res) => {
        const handler = () => {
          v.removeEventListener('seeked', handler);
          res();
        };
        v.addEventListener('seeked', handler);
      });

      renderCurrentFrame(false, 'processed');

      const pct = Math.round((i / totalSteps) * 100);
      setExportProgress(pct);
      setExportStatusText(`렌더링 중 (${i + 1}/${totalSteps} 프레임)...`);
      await new Promise((r) => setTimeout(r, 10));
    }

    recorder.stop();
  };

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const cliCmd = `python scripts/remove_watermark.py ${videoName} --mode ${algo} --w ${wPct} --h ${hPct} --mr ${mrPct} --mb ${mbPct} --feather ${feather}`;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <span className="font-bold text-sm text-[#ffd54f]">AI 영상 워터마크 제거 스튜디오</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#c8aa6e]/20 border border-[#c8aa6e] text-[#ffd54f] font-mono">
            DELOGO STUDIO
          </span>
        </div>
      }
      open={open}
      onClose={onClose}
      maxWidth="max-w-[96vw] lg:max-w-[1300px]"
      maxHeight="max-h-[94dvh]"
    >
      <div className="flex flex-col lg:flex-row gap-4 p-1 text-white">
        {/* ── 좌측: 캔버스 뷰포트 & 플레이어 ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="relative bg-[#05070a] border border-[#1f2d45] rounded-xl overflow-hidden min-h-[320px] max-h-[60vh] flex items-center justify-center shadow-lg">
            <canvas ref={canvasRef} className="max-w-full max-h-[58vh] object-contain block" />
          </div>

          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted
            loop={isLooping}
            crossOrigin="anonymous"
            className="hidden"
          />

          {/* 재생 컨트롤 바 */}
          <div className="p-2.5 rounded-xl bg-[#0e1726] border border-[#1f2d45] flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePlayToggle}
              className="px-3 py-1.5 rounded-lg bg-[#142238] border border-[#1f3557] hover:border-[#00d2ff] text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className="px-2.5 py-1.5 rounded-lg bg-[#142238] border border-[#1f3557] text-xs transition-colors cursor-pointer"
            >
              {isLooping ? '🔁 루프 ON' : '➡️ 루프 OFF'}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="flex-1 min-w-[120px] h-1.5 accent-[#ffd54f] cursor-pointer"
            />
            <span className="font-mono text-xs text-[#8b9bb4]">
              {formatSec(currentTime)} / {formatSec(duration)}
            </span>

            <div className="h-4 border-l border-[#24334a] mx-1" />

            {/* 비교 뷰 토글 */}
            <button
              onClick={() => {
                if (viewMode === 'processed') setViewMode('split');
                else if (viewMode === 'split') setViewMode('original');
                else setViewMode('processed');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#00d2ff1a] border border-[#00d2ff44] text-[#00d2ff] hover:bg-[#00d2ff33] text-xs font-bold transition-colors cursor-pointer"
            >
              {viewMode === 'processed' && '⚡ 제거 뷰'}
              {viewMode === 'split' && '⚖️ 분할 비교'}
              {viewMode === 'original' && '👁️ 원본 뷰'}
            </button>
            <button
              onClick={() => setShowBox(!showBox)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                showBox
                  ? 'bg-[#ffd54f1a] border-[#ffd54f44] text-[#ffd54f]'
                  : 'bg-[#142238] border-[#1f3557] text-[#8b9bb4]'
              }`}
            >
              {showBox ? '🔲 박스 ON' : '⬜ 박스 OFF'}
            </button>
          </div>

          {/* 에셋 선택 & 프리셋 로드 버튼 */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#8b9bb4] font-bold">소스 영상:</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.2 rounded-lg bg-[#142238] border border-[#1f3557] hover:border-[#c8aa6e] text-white transition-colors cursor-pointer"
            >
              📂 파일 선택
            </button>
            <button
              onClick={() => {
                setVideoSrc('assets/citadel_bonfire.mp4');
                setVideoName('citadel_bonfire.mp4');
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1.2 rounded-lg border transition-colors cursor-pointer ${
                videoName === 'citadel_bonfire.mp4'
                  ? 'bg-[#c8aa6e22] border-[#c8aa6e] text-[#ffd54f] font-bold'
                  : 'bg-[#142238] border-[#1f3557] text-[#8b9bb4]'
              }`}
            >
              🔥 성채 10s 영상
            </button>
            <button
              onClick={() => {
                setVideoSrc('assets/citadel_9x16_mobile.mp4');
                setVideoName('citadel_9x16_mobile.mp4');
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1.2 rounded-lg border transition-colors cursor-pointer ${
                videoName === 'citadel_9x16_mobile.mp4'
                  ? 'bg-[#00d2ff22] border-[#00d2ff] text-[#00d2ff] font-bold'
                  : 'bg-[#142238] border-[#1f3557] text-[#8b9bb4]'
              }`}
            >
              📱 모바일 9:16 성화
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <a
              href="tools/watermark-remover.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-2.5 py-1.2 rounded-lg bg-[#00d2ff1a] border border-[#00d2ff44] text-[#00d2ff] hover:bg-[#00d2ff33] text-xs font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>🔗 독립 웹페이지로 열기</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>

          {/* 내보내기 상태 바 */}
          {isExporting && (
            <div className="p-3 rounded-xl bg-[#09111c] border border-[#00d2ff44]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#00d2ff] font-bold">{exportStatusText}</span>
                <span className="font-mono text-[#ffd54f]">{exportProgress}%</span>
              </div>
              <div className="w-full bg-[#05070a] border border-[#142033] rounded-md h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00d2ff] to-[#ffd54f] transition-all duration-100"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 우측: 세부 조정 & 파라미터 패널 ── */}
        <div className="w-full lg:w-[360px] flex flex-col gap-3 shrink-0">
          {/* 1. 알고리즘 선택 */}
          <div className="p-3 rounded-xl bg-[#0e1726] border border-[#1f2d45] flex flex-col gap-2">
            <span className="text-xs font-bold text-[#c8aa6e]">🧠 제거 알고리즘</span>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as DelogoAlgo)}
              className="bg-[#080d16] border border-[#1f3557] rounded-lg p-2 text-xs text-white outline-none"
            >
              <option value="patch">🌟 스마트 배경 패치 클론 (추천)</option>
              <option value="blur">💧 가우시안 디로고 블러</option>
              <option value="interpolate">📐 4방향 경계선 픽셀 보간</option>
              <option value="vignette">🕶️ 시네마틱 다크 코너 비네트</option>
            </select>

            {algo === 'patch' && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-[#8b9bb4]">복제 방향:</span>
                <button
                  type="button"
                  onClick={() => setPatchDir('top')}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    patchDir === 'top'
                      ? 'bg-[#00d2ff22] border border-[#00d2ff] text-white font-bold'
                      : 'bg-[#080d16] border border-[#1f2d45] text-[#8b9bb4]'
                  }`}
                >
                  위쪽 배경
                </button>
                <button
                  type="button"
                  onClick={() => setPatchDir('left')}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    patchDir === 'left'
                      ? 'bg-[#00d2ff22] border border-[#00d2ff] text-white font-bold'
                      : 'bg-[#080d16] border border-[#1f2d45] text-[#8b9bb4]'
                  }`}
                >
                  왼쪽 배경
                </button>
              </div>
            )}
          </div>

          {/* 2. 바운딩 박스 슬라이더 */}
          <div className="p-3 rounded-xl bg-[#0e1726] border border-[#1f2d45] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#c8aa6e]">📍 워터마크 영역</span>
              <span className="text-[10px] font-mono text-[#00d2ff]">
                {videoResolution.w} x {videoResolution.h}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-[#8b9bb4]">
                <span>가로 너비 (Width)</span>
                <span className="font-mono text-[#ffd54f] font-bold">{wPct}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={35}
                step={0.5}
                value={wPct}
                onChange={(e) => setWPct(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#00d2ff] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-[#8b9bb4]">
                <span>세로 높이 (Height)</span>
                <span className="font-mono text-[#ffd54f] font-bold">{hPct}%</span>
              </div>
              <input
                type="range"
                min={3}
                max={25}
                step={0.5}
                value={hPct}
                onChange={(e) => setHPct(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#00d2ff] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-[#8b9bb4]">
                <span>우측 여백 (Margin Right)</span>
                <span className="font-mono text-[#ffd54f] font-bold">{mrPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={mrPct}
                onChange={(e) => setMrPct(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#00d2ff] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-[#8b9bb4]">
                <span>하단 여백 (Margin Bottom)</span>
                <span className="font-mono text-[#ffd54f] font-bold">{mbPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={mbPct}
                onChange={(e) => setMbPct(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#00d2ff] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-[#8b9bb4]">
                <span>페더 / 소프트 블러 반경</span>
                <span className="font-mono text-[#ffd54f] font-bold">{feather}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={35}
                step={1}
                value={feather}
                onChange={(e) => setFeather(parseInt(e.target.value))}
                className="w-full h-1.5 accent-[#00d2ff] cursor-pointer"
              />
            </div>
          </div>

          {/* 3. 작업 액션 버튼들 */}
          <div className="p-3 rounded-xl bg-[#0e1726] border border-[#1f2d45] flex flex-col gap-2">
            <button
              onClick={handleCaptureFrame}
              className="w-full py-2 rounded-lg bg-[#c8aa6e1a] border border-[#c8aa6e] hover:bg-[#c8aa6e33] text-[#ffd54f] font-bold text-xs transition-colors cursor-pointer"
            >
              📸 현재 프레임 PNG 캡처
            </button>
            <button
              onClick={handleExportVideo}
              disabled={isExporting}
              className="w-full py-2.5 rounded-lg bg-[#00d2ff] hover:bg-[#33dcff] text-[#07080d] font-bold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {isExporting ? '⏳ 인코딩 진행 중...' : '💾 워터마크 제거 영상 내보내기 (.webm/.mp4)'}
            </button>
          </div>

          {/* 4. CLI 명령어 */}
          <div className="p-3 rounded-xl bg-[#070a12] border border-[#142033] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#c8aa6e]">💻 CLI Python 스크립트</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cliCmd);
                  alert('명령어가 복사되었습니다:\n' + cliCmd);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2d45] text-[#00d2ff] hover:text-white"
              >
                복사
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#79c0ff] bg-[#030508] p-2 rounded border border-[#101928] break-all select-all">
              {cliCmd}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
