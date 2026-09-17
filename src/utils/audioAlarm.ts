// Web Audio API & Speech Alarm Synthesizer for Driver Alerts

class AlarmSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private continuousOscillator: OscillatorNode | null = null;
  private continuousGain: GainNode | null = null;
  private isSpeechActive = false;
  private lastSpeechTime = 0;

  public initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public speakAlert(phrase: string) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (now - this.lastSpeechTime < 2500) return; // Debounce speech
    this.lastSpeechTime = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.15;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  }

  public playWarningBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio playback prevented:', e);
    }
  }

  public playDrowsyAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.speakAlert('Warning! Eyes closed. Wake up!');

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(700, now + 0.1);
      osc.frequency.setValueAtTime(1000, now + 0.2);
      osc.frequency.setValueAtTime(700, now + 0.3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      console.warn('Audio alarm playback error:', e);
    }
  }

  public playEmergencyAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.speakAlert('Emergency! Critical drowsiness! Pull over!');

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Emergency alarm playback error:', e);
    }
  }

  public stopAlarm() {
    if (this.continuousOscillator) {
      try {
        this.continuousOscillator.stop();
        this.continuousOscillator.disconnect();
      } catch (e) {}
      this.continuousOscillator = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export const alarmSynth = new AlarmSynthesizer();
