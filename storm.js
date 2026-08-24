const canvas = document.createElement('canvas');
canvas.id = 'scene';
canvas.className = 'storm-canvas';
document.body.prepend(canvas);

const context = canvas.getContext('2d');
const icons = ['</>', '$', 'MKT', 'TAX', 'ERP', '%', 'BR', 'LAW', 'SEO', 'AI', 'WEB', 'BD'];
const nodes = [];
const pointer = { x: 0, y: 0, active: false };
let width = 0, height = 0, pixelRatio = 1, scrollAmount = 0;

function seedRandom(seed) {
  return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = width * pixelRatio; canvas.height = height * pixelRatio;
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createNodes() {
  const random = seedRandom(2026);
  nodes.length = 0;
  for (let i = 0; i < 260; i++) {
    const latitude = Math.acos(1 - 2 * (i + .5) / 260), longitude = Math.PI * (3 - Math.sqrt(5)) * i;
    const x = Math.sin(latitude) * Math.cos(longitude), y = Math.cos(latitude), z = Math.sin(latitude) * Math.sin(longitude);
    nodes.push({ baseX: x, baseY: y, baseZ: z, x, y, z, size: 2.4 + random() * 3.2, icon: icons[i % icons.length], phase: random() * Math.PI * 2 });
  }
}

function draw() {
  const time = performance.now() * .001;
  context.clearRect(0, 0, width, height);
  const scale = Math.min(width, height) * .46;
  const centerX = width * .5 + pointer.x * 18;
  const centerY = height * .43 + scrollAmount * 18 + pointer.y * 12;
  const rotation = time * .12 + pointer.x * .18, tilt = pointer.y * .12;
  const positions = nodes.map((node) => {
    const pulse = Math.sin(time * 1.4 + node.phase) * .012;
    let x = node.baseX * (1 + pulse), y = node.baseY * (1 + pulse), z = node.baseZ;
    const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation), rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);
    x = rotatedX; z = rotatedZ;
    const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt), tiltedZ = y * Math.sin(tilt) + z * Math.cos(tilt);
    y = tiltedY; z = tiltedZ;
    const dx = pointer.x * 1.1 - x, dy = pointer.y * .85 - y, distance = Math.hypot(dx, dy);
    if (pointer.active && distance < .58) { const force = Math.pow(1 - distance / .58, 2) * .06; x += dx * force; y += dy * force; }
    node.x += (x - node.x) * .08; node.y += (y - node.y) * .08;
    node.z += (z - node.z) * .08;
    return { x: centerX + node.x * scale, y: centerY - node.y * scale, depth: node.z, node };
  });
  context.lineWidth = 0.7; context.globalAlpha = .42;
  positions.forEach((a, index) => positions.slice(index + 1).forEach((b) => {
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (distance < scale * .16) { context.strokeStyle = `rgba(75,75,75,${.1 + Math.max(0, (a.depth + b.depth) * .08)})`; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke(); }
  }));
  positions.forEach(({ x, y, depth, node }) => {
    const radius = node.size + Math.sin(time * 2 + node.phase) * .7;
    context.globalAlpha = .24 + (depth + 1) * .28; context.shadowBlur = 14; context.shadowColor = 'rgba(50,50,50,.24)'; context.fillStyle = depth > .1 ? 'rgba(55,55,55,.72)' : 'rgba(255,255,255,.58)';
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill(); context.strokeStyle = 'rgba(255,255,255,.68)'; context.lineWidth = .8; context.stroke(); context.shadowBlur = 0;
    context.font = `700 ${Math.max(7, radius * 1.65)}px Arial, sans-serif`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillStyle = depth > .1 ? '#fff' : '#333'; context.fillText(node.icon, x, y);
  });
  context.globalAlpha = 1;
  requestAnimationFrame(draw);
}

resize(); createNodes();
window.addEventListener('resize', resize);
window.addEventListener('scroll', () => { const max = document.documentElement.scrollHeight - height; scrollAmount = max ? window.scrollY / max : 0; }, { passive: true });
window.addEventListener('pointermove', (event) => { pointer.x = event.clientX / width * 2 - 1; pointer.y = -(event.clientY / height * 2 - 1); pointer.active = true; }, { passive: true });
window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
draw();
