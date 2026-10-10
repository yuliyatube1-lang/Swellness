import {AbsoluteFill, Audio, Sequence, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';

export const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);
export const DURATION = sec(9.6);

// Light normalisation: brightness factor brings every clip to ~118 average luma (measured with ffmpeg).
type Clip = {file: string | null; start: number; len: number; bright: number; zoom: 'in' | 'out'};
const SLOT = 1.2;
const CLIPS: Clip[] = [
  {file: 'walk', start: 2.0, len: SLOT, bright: 0.9, zoom: 'in'},
  {file: 'rain', start: 1.8, len: SLOT, bright: 0.84, zoom: 'out'},
  {file: 'table', start: 0.2, len: SLOT, bright: 1.28, zoom: 'in'},
  {file: 'lamp', start: 0.5, len: SLOT, bright: 1.15, zoom: 'out'},
  {file: 'book', start: 0.4, len: SLOT, bright: 0.95, zoom: 'in'},
  {file: null /* спортзал: сюда встанет кадр зала */, start: 0, len: SLOT, bright: 1, zoom: 'in'},
  {file: 'class', start: 3.0, len: SLOT, bright: 0.92, zoom: 'out'},
  {file: 'cafe', start: 0.2, len: SLOT, bright: 0.9, zoom: 'in'},
];

const Shot: React.FC<{clip: Clip; frames: number}> = ({clip, frames}) => {
  const f = useCurrentFrame();
  const t = f / frames;
  const scale = clip.zoom === 'in' ? 1.04 + t * 0.07 : 1.11 - t * 0.07;
  const fadeIn = interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
  if (!clip.file) {
    return (
      <AbsoluteFill style={{background: 'linear-gradient(160deg,#2a2622,#14110f)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 220}}>
        <div style={{color: '#cdbfae', fontFamily: 'Inter', fontSize: 44, letterSpacing: 6, textTransform: 'uppercase'}}>кадр спортзала</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <OffthreadVideo
        src={staticFile(`clips/${clip.file}.mp4`)}
        startFrom={sec(clip.start)}
        muted
        style={{
          width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`,
          filter: `brightness(${clip.bright}) contrast(1.05) saturate(0.92) sepia(0.1)`,
        }}
      />
    </AbsoluteFill>
  );
};

type Line = {text: string[]; from: number; to: number; type?: boolean};
const LINES: Line[] = [
  {text: ['3 месяца.'], from: 0.1, to: 1.2, type: true},
  {text: ['Октябрь', 'Ноябрь', 'Декабрь'], from: 1.2, to: 3.8},
  {text: ['Возьми следующие 3 месяца'], from: 3.8, to: 5.4},
  {text: ['и посвяти их действиям,', 'которые помогут'], from: 5.4, to: 7.6},
  {text: ['тебе стать той версией себя,', 'которой ты хочешь быть.'], from: 7.6, to: 9.6},
];

const Caption: React.FC<{line: Line}> = ({line}) => {
  const f = useCurrentFrame();
  const total = sec(line.to - line.from);
  const full = line.text.join('\n');
  let shown = full;
  if (line.type) {
    const n = Math.min(full.length, Math.floor(interpolate(f, [0, sec(0.8)], [0, full.length + 1], {extrapolateRight: 'clamp'})));
    shown = full.slice(0, n);
  }
  const opacity = line.type ? 1 : interpolate(f, [0, 6, total - 5, total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = line.type ? 0 : interpolate(f, [0, 8], [14, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity, transform: `translateY(${y}px)`}}>
      <div style={{
        color: '#fff', fontFamily: 'Inter', fontWeight: 500, fontSize: 56, lineHeight: 1.35, textAlign: 'center',
        whiteSpace: 'pre', letterSpacing: 0.5, textShadow: '0 2px 24px rgba(0,0,0,.45)',
      }}>{shown}{line.type && f < total ? <span style={{opacity: f % 16 < 8 ? 1 : 0}}>|</span> : null}</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{background: '#111'}}>
    {CLIPS.map((c, i) => (
      <Sequence key={i} from={sec(i * SLOT)} durationInFrames={sec(SLOT)}>
        <Shot clip={c} frames={sec(SLOT)} />
      </Sequence>
    ))}
    {/* единая мягкая тонировка + затемнение под текст */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,.30) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,.38) 100%)'}} />
    {LINES.map((l, i) => (
      <Sequence key={i} from={sec(l.from)} durationInFrames={sec(l.to - l.from)}>
        <Caption line={l} />
      </Sequence>
    ))}
    <Audio src={staticFile('audio/music.mp3')} />
  </AbsoluteFill>
);
