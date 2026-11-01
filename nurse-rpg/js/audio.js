// Original procedural score: slow pentatonic bells over a quiet two-note drone.
// No recordings, external assets, or network calls. Sound requires user intent.
export function createAudio() {
  let context,
    master,
    timer,
    muted = true,
    disposed = false,
    step = 0;
  const active = new Set();
  const melody = [60, 67, 69, 64, 62, 67, 72, 69, 64, 62, 60, 67];
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

  function note(midi, duration, volume, type = "sine", delay = 0) {
    if (!context || muted || document.hidden || disposed) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.value = frequency(midi);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(master);
    active.add(oscillator);
    oscillator.onended = () => {
      active.delete(oscillator);
      gain.disconnect();
      oscillator.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.1);
  }

  function phrase() {
    if (muted || document.hidden || !context || context.state !== "running")
      return;
    note(melody[step % melody.length], 3.5, 0.07);
    if (step % 4 === 0) {
      note(step % 8 === 0 ? 48 : 43, 8, 0.035, "triangle");
      note(55, 7, 0.025);
    }
    step++;
  }

  async function activate() {
    if (muted || disposed || document.hidden) return;
    try {
      context ||= new AudioContext();
      if (!master) {
        master = context.createGain();
        master.gain.value = 0.35;
        master.connect(context.destination);
      }
      await context.resume();
      if (!timer && !muted && !disposed) {
        phrase();
        timer = setInterval(phrase, 2300);
      }
    } catch {
      /* Audio availability never blocks play. */
    }
  }

  function hush() {
    clearInterval(timer);
    timer = undefined;
    for (const oscillator of active) {
      try {
        oscillator.stop();
      } catch {}
    }
    active.clear();
    context?.suspend().catch(() => {});
  }
  function onGesture() {
    if (!muted) activate();
  }
  function onVisibility() {
    if (document.hidden) hush();
    else if (!muted && context) activate();
  }
  document.addEventListener("pointerdown", onGesture);
  document.addEventListener("keydown", onGesture);
  document.addEventListener("visibilitychange", onVisibility);
  return {
    setMuted(value) {
      muted = !!value;
      if (muted) hush();
      else if (navigator.userActivation?.isActive || context) activate();
    },
    chime() {
      if (muted) return;
      activate().then(() => {
        note(72, 0.7, 0.12);
        note(79, 1, 0.09, "sine", 0.12);
      });
    },
    dispose() {
      disposed = true;
      hush();
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisibility);
      context?.close().catch(() => {});
    },
  };
}
