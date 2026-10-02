// Sample the scene only while information is open; no image is displayed or saved.
const linear = value => {
  const channel = value / 255;
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
};

export function deriveSurfacePalette(pixels, previousDark = null) {
  const mean = [0, 0, 0];
  let weight = 0, luminance = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    weight += alpha;
    for (let channel = 0; channel < 3; channel++) mean[channel] += pixels[index + channel] * alpha;
    luminance += alpha * (.2126 * linear(pixels[index]) + .7152 * linear(pixels[index + 1]) + .0722 * linear(pixels[index + 2]));
  }
  // Discard empty/unavailable GPU frames instead of flashing a black surface.
  if (!weight || weight < pixels.length / 4 * .5) return null;
  luminance /= weight;
  const dark = previousDark === null ? luminance < .34 : previousDark ? luminance < .40 : luminance < .28;
  const base = mean.map((channel, index) => Math.round(dark
    ? [20, 26, 29][index] * .8 + channel / weight * .2
    : 249 * .92 + channel / weight * .08));
  return { dark, base, highlight: base.map(channel => Math.min(255, channel + (dark ? 9 : 5))) };
}

export function createAboutSurface({ dialog, getScene = () => null }) {
  const capture = document.createElement('canvas');
  const sample = document.createElement('canvas');
  sample.width = sample.height = 32;
  const context = sample.getContext('2d', { willReadFrequently: true });
  let timer = 0, frame = 0, previousDark = null;

  function apply(palette) {
    if (!palette) return;
    previousDark = palette.dark;
    const colors = palette.dark ? {
      ink: '#f2f5f3', muted: '#d1dad6', control: '241 247 244', 'control-alpha': '.085',
      active: '235 242 238', 'active-ink': '#1d2825', divider: '219 235 228'
    } : {
      ink: '#202a28', muted: '#35413d', control: '44 62 53', 'control-alpha': '.065',
      active: '255 255 255', 'active-ink': '#202a28', divider: '36 56 47'
    };
    dialog.style.setProperty('--about-base', palette.base.join(' '));
    dialog.style.setProperty('--about-highlight', palette.highlight.join(' '));
    for (const [property, value] of Object.entries(colors)) dialog.style.setProperty('--about-' + property, value);
    dialog.style.colorScheme = palette.dark ? 'dark' : 'light';
    dialog.dataset.appearance = palette.dark ? 'dark' : 'light';
  }

  function update() {
    frame = 0;
    if (!dialog.open || document.hidden) return;
    try {
      const scene = getScene();
      if (!context || !scene?.ready || !scene.capture(capture) || !capture.width || !capture.height) return;
      const panel = dialog.getBoundingClientRect();
      // Source captures already match the player's full-viewport framing.
      const scaleX = capture.width / innerWidth, scaleY = capture.height / innerHeight;
      context.clearRect(0, 0, 32, 32);
      context.drawImage(capture, panel.left * scaleX, panel.top * scaleY,
        panel.width * scaleX, panel.height * scaleY, 0, 0, 32, 32);
      apply(deriveSurfacePalette(context.getImageData(0, 0, 32, 32).data, previousDark));
    } catch { /* Preserve the last readable palette if a renderer is unavailable. */ }
  }
  function refresh() {
    if (dialog.open && !document.hidden && !frame) frame = requestAnimationFrame(update);
  }
  function stop() {
    clearInterval(timer); timer = 0;
    cancelAnimationFrame(frame); frame = 0;
    capture.width = capture.height = 0;
  }
  const resize = new ResizeObserver(refresh);
  resize.observe(dialog);
  window.addEventListener('resize', refresh);
  document.addEventListener('visibilitychange', refresh);
  return {
    start() {
      stop(); previousDark = null;
      const home = document.body.classList.contains('atHome');
      apply({ dark: !home, base: home ? [247, 249, 247] : [20, 26, 29], highlight: home ? [252, 254, 252] : [29, 35, 38] });
      previousDark = null;
      // Start before the modal's opening paint; refresh at a bounded rate afterwards.
      update(); timer = setInterval(refresh, 1000);
    },
    stop,
    destroy() {
      stop(); resize.disconnect();
      window.removeEventListener('resize', refresh);
      document.removeEventListener('visibilitychange', refresh);
      sample.width = sample.height = 0;
    }
  };
}
