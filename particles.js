const particleCanvas = document.getElementById("particleCanvas");
const particleContext = particleCanvas.getContext("2d", { alpha: true });

const particleState = {
  width: 0,
  height: 0,
  dpr: 1,
  particles: [],
  raf: 0,
  lastTime: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  settings: {
    enabled: true,
    density: 58,
    glow: 62,
    motion: 0.7,
    paletteMode: 0,
    brightness: 28
  }
};

const particlePalettes = [
  ["rgba(178, 217, 218,", "rgba(148, 168, 210,", "rgba(190, 186, 162,"],
  ["rgba(210, 214, 214,", "rgba(145, 154, 160,", "rgba(188, 178, 160,"],
  ["rgba(118, 205, 204,", "rgba(105, 151, 176,", "rgba(170, 190, 160,"],
  ["rgba(158, 151, 222,", "rgba(185, 150, 206,", "rgba(194, 174, 150,"],
  ["rgba(120, 205, 166,", "rgba(130, 170, 198,", "rgba(178, 198, 130,"]
];

function clampParticle(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function activeParticlePalette() {
  return particlePalettes[particleState.settings.paletteMode] || particlePalettes[0];
}

function targetParticleCount() {
  const area = particleState.width * particleState.height;
  const base = clampParticle(Math.round(area / 24000), 18, 80);
  return Math.round(base * (particleState.settings.density / 55));
}

function makeParticle(index) {
  return {
    index,
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * 0.42 + 0.08,
    depth: Math.random(),
    orbit: (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
    x: Math.random() * particleState.width,
    y: Math.random() * particleState.height,
    size: 0.7 + Math.random() * 1.9,
    pulse: Math.random() * Math.PI * 2,
    color: Math.floor(Math.random() * 3)
  };
}

function syncParticleCount() {
  const target = targetParticleCount();
  while (particleState.particles.length < target) {
    particleState.particles.push(makeParticle(particleState.particles.length));
  }

  if (particleState.particles.length > target) {
    particleState.particles.length = target;
  }
}

function resizeParticles() {
  const rect = particleCanvas.getBoundingClientRect();
  particleState.width = rect.width;
  particleState.height = rect.height;
  particleState.dpr = Math.min(window.devicePixelRatio || 1, 2);
  particleCanvas.width = Math.max(1, Math.floor(rect.width * particleState.dpr));
  particleCanvas.height = Math.max(1, Math.floor(rect.height * particleState.dpr));
  particleContext.setTransform(particleState.dpr, 0, 0, particleState.dpr, 0, 0);
  syncParticleCount();
}

function drawConnection(first, second, alpha) {
  particleContext.beginPath();
  particleContext.moveTo(first.x, first.y);
  particleContext.lineTo(second.x, second.y);
  particleContext.strokeStyle = `rgba(226, 232, 224, ${alpha})`;
  particleContext.lineWidth = 0.45;
  particleContext.stroke();
}

function updateParticle(particle, elapsed, centerX, centerY) {
  const motion = particleState.reducedMotion || !particleState.settings.enabled
    ? 0
    : particleState.settings.motion;
  const quotePull = 0.018 + particle.depth * 0.014;
  const orbitSpeed = (0.000018 + particle.depth * 0.000028) * particle.orbit * motion;

  particle.angle += elapsed * orbitSpeed;

  const orbitX = centerX + Math.cos(particle.angle) * particle.radius * particleState.width;
  const orbitY = centerY + Math.sin(particle.angle * 0.82) * particle.radius * particleState.height;
  particle.x += (orbitX - particle.x) * quotePull * motion;
  particle.y += (orbitY - particle.y) * quotePull * motion;
  particle.pulse += elapsed * 0.001 * (0.2 + particle.depth) * Math.max(motion, 0.12);
}

function drawParticles(timestamp = 0) {
  const elapsed = particleState.lastTime ? Math.min(timestamp - particleState.lastTime, 48) : 16;
  particleState.lastTime = timestamp;
  particleContext.clearRect(0, 0, particleState.width, particleState.height);

  if (!particleState.settings.enabled || particleState.settings.density <= 0) {
    particleState.raf = window.requestAnimationFrame(drawParticles);
    return;
  }

  const palette = activeParticlePalette();
  const centerX = particleState.width / 2;
  const centerY = particleState.height / 2;
  const glow = particleState.settings.glow / 100;
  const brightness = particleState.settings.brightness / 100;
  const alphaBase = 0.13 + glow * 0.17 + brightness * 0.08;

  for (const particle of particleState.particles) {
    updateParticle(particle, elapsed, centerX, centerY);
  }

  for (let i = 0; i < particleState.particles.length; i += 1) {
    const first = particleState.particles[i];
    for (let j = i + 1; j < particleState.particles.length; j += 1) {
      const second = particleState.particles[j];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (distance < 118) {
        drawConnection(first, second, (1 - distance / 118) * 0.035 * glow);
      }
    }
  }

  for (const particle of particleState.particles) {
    const pulse = (Math.sin(particle.pulse) + 1) / 2;
    const alpha = alphaBase * (0.42 + particle.depth * 0.72) * (0.7 + pulse * 0.3);
    const size = particle.size * (0.85 + particle.depth * 0.55);
    const gradient = particleContext.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size * 7.5);
    gradient.addColorStop(0, `${palette[particle.color]}${alpha})`);
    gradient.addColorStop(0.28, `${palette[particle.color]}${alpha * 0.34})`);
    gradient.addColorStop(1, `${palette[particle.color]}0)`);

    particleContext.fillStyle = gradient;
    particleContext.beginPath();
    particleContext.arc(particle.x, particle.y, size * 7.5, 0, Math.PI * 2);
    particleContext.fill();

    particleContext.fillStyle = `rgba(246, 248, 239, ${alpha * 0.42})`;
    particleContext.beginPath();
    particleContext.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    particleContext.fill();
  }

  particleState.raf = window.requestAnimationFrame(drawParticles);
}

function setParticleSettings(nextSettings) {
  Object.assign(particleState.settings, nextSettings);
  syncParticleCount();
}

function startParticles() {
  resizeParticles();
  window.addEventListener("resize", resizeParticles);
  particleState.raf = window.requestAnimationFrame(drawParticles);
}

window.bdParticles = {
  set: setParticleSettings,
  resize: resizeParticles
};

startParticles();
