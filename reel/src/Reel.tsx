import {AbsoluteFill, Audio, Img, Sequence, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';

export const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);

// Light normalisation: brightness factor brings every clip to ~118 average luma (measured with ffmpeg).
type Clip = {file: string | null; start: number; bright: number; zoom: 'in' | 'out'; len?: number; origin?: string; base?: number};
const SLOT = 0.95;
const CLIPS: Clip[] = [
  {file: 'walk', start: 2.0, bright: 0.9, zoom: 'in'},
  {file: 'rain', start: 1.8, bright: 0.84, zoom: 'out'},
  {file: 'table', start: 0.2, bright: 1.28, zoom: 'in'},
  {file: 'lamp', start: 0.5, bright: 1.15, zoom: 'out'},
  {file: 'food', start: 0.3, bright: 0.82, zoom: 'in'},
  {file: 'vitamins.jpg', start: 0, bright: 0.75, zoom: 'out'},
  {file: 'book', start: 0.4, bright: 0.95, zoom: 'in'},
  {file: 'gym', start: 4.3, len: 1.15, bright: 1.05, zoom: 'out', origin: '75% 100%', base: 1.08},
  {file: 'desk', start: 4.8, bright: 1.0, zoom: 'out', len: 3.0},
];
const lens = CLIPS.map((c) => sec(c.len ?? SLOT));
const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
export const DURATION = lens.reduce((a, b) => a + b, 0);
const MUSIC = sec(9.6);

const Shot: React.FC<{clip: Clip; frames: number; first?: boolean}> = ({clip, frames, first}) => {
  const f = useCurrentFrame();
  const t = f / frames;
  const b = clip.base ?? 1.04;
  const scale = clip.zoom === 'in' ? b + t * 0.07 : b + 0.07 - t * 0.07;
  const fadeIn = first ? 1 : interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
  if (!clip.file) {
    return (
      <AbsoluteFill style={{background: 'linear-gradient(160deg,#2a2622,#14110f)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 220}}>
        <div style={{color: '#cdbfae', fontFamily: 'Inter', fontSize: 44, letterSpacing: 6, textTransform: 'uppercase'}}>кадр спортзала</div>
      </AbsoluteFill>
    );
  }
  const style = {
    width: '100%', height: '100%', objectFit: 'cover' as const, transform: `scale(${scale})`, transformOrigin: clip.origin ?? '50% 50%',
    filter: `brightness(${clip.bright}) contrast(1.05) saturate(0.92) sepia(0.1)`,
  };
  if (clip.file.endsWith('.jpg')) {
    return (
      <AbsoluteFill style={{opacity: fadeIn}}>
        <Img src={staticFile(`clips/${clip.file}`)} style={style} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <OffthreadVideo
        src={staticFile(`clips/${clip.file}.mp4`)}
        startFrom={sec(clip.start)}
        muted
        style={style}
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
  {text: ['тебе стать той версией себя,', 'которой ты хочешь быть.'], from: 7.6, to: DURATION / FPS},
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
      <Sequence key={i} from={starts[i]} durationInFrames={lens[i] + 5}>
        <Shot clip={c} frames={lens[i] + 5} first={i === 0} />
      </Sequence>
    ))}
    {/* единая мягкая тонировка + затемнение под текст */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,.30) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,.38) 100%)'}} />
    {LINES.map((l, i) => (
      <Sequence key={i} from={sec(l.from)} durationInFrames={sec(l.to - l.from)}>
        <Caption line={l} />
      </Sequence>
    ))}
    <Audio src={staticFile('audio/music.mp3')} volume={(f) => interpolate(f, [MUSIC - 12, MUSIC], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
  </AbsoluteFill>
);
