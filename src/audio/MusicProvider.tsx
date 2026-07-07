import { useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { music, type MusicTrack } from './music';
import { armSfx, setSfxEnabled } from './sfx';
import { armVoice, setVoiceEnabled } from './voice';

/** Music defaults ON; treat a missing setting (older saved state) as enabled. */
export function useMusicEnabled(): [boolean, (on: boolean) => void] {
  const { state, dispatch } = useApp();
  const enabled = state.settings.music ?? true;
  return [enabled, (on) => dispatch({ type: 'updateSettings', patch: { music: on } })];
}

/** Sound effects default ON. */
export function useSfxEnabled(): [boolean, (on: boolean) => void] {
  const { state, dispatch } = useApp();
  const enabled = state.settings.sfx ?? true;
  return [enabled, (on) => dispatch({ type: 'updateSettings', patch: { sfx: on } })];
}

/** Master sound switch (music + effects together) — drives the Kid Zone speaker. */
export function useSoundMaster(): { anyOn: boolean; setAll: (on: boolean) => void } {
  const { state, dispatch } = useApp();
  const anyOn = (state.settings.music ?? true) || (state.settings.sfx ?? true);
  return { anyOn, setAll: (on) => dispatch({ type: 'updateSettings', patch: { music: on, sfx: on } }) };
}

/**
 * Mounts the audio system and keeps it in sync with the mute settings.
 * The ambient `app` track is the default; games override it via useSceneMusic.
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [musicOn] = useMusicEnabled();
  const [sfxOn] = useSfxEnabled();

  useEffect(() => {
    music.init();
    music.setTrack('app');
    armSfx();
    armVoice();
  }, []);

  useEffect(() => {
    music.setEnabled(musicOn);
  }, [musicOn]);

  useEffect(() => {
    setSfxEnabled(sfxOn);
    setVoiceEnabled(sfxOn);
  }, [sfxOn]);

  return <>{children}</>;
}

/** Play a specific track while this component is mounted; revert to `app` after. */
export function useSceneMusic(track: MusicTrack) {
  useEffect(() => {
    music.setTrack(track);
    return () => music.setTrack('app');
  }, [track]);
}
