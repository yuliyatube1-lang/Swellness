import {Composition} from 'remotion';
import {Reel, FPS, DURATION} from './Reel';

export const Root = () => (
  <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
