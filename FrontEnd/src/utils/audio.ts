// Web Audio Synthesizer for message chimes (No external audio file needed)
export function playChatChime(type: 'send' | 'receive' = 'receive') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    if (type === 'send') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(580, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } else {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(520, ctx.currentTime)
      osc1.frequency.setValueAtTime(780, ctx.currentTime + 0.08)
      osc2.frequency.setValueAtTime(1040, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start()
      osc2.start(ctx.currentTime + 0.08)
      osc1.stop(ctx.currentTime + 0.29)
      osc2.stop(ctx.currentTime + 0.29)
    }
  } catch {
    // AudioContext might be blocked before first user interaction
  }
}
