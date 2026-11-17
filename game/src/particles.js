// Particles, floating text, lightning bolts and screen shake. Pure canvas, no assets.

export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
    this.bolts = [];
    this.shake = 0;
  }

  add(x, y, vx, vy, life, size, color, gravity = 0, drag = 1) {
    if (this.list.length > 600) return;
    this.list.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity, drag });
  }

  burst(x, y, n, color, speed = 120, size = 3, gravity = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.add(x, y, Math.cos(a) * s, Math.sin(a) * s - speed * 0.25, 0.4 + Math.random() * 0.5, size * (0.6 + Math.random() * 0.8), color, gravity);
    }
  }

  splash(x, y) { this.burst(x, y, 10, '#7fe7f2', 90, 2.5, 140); this.burst(x, y, 5, '#ffffff', 60, 2, 120); }
  sparks(x, y, color) { this.burst(x, y, 8, color || '#ffd166', 150, 2.5, 0); }
  frostPuff(x, y) { this.burst(x, y, 6, '#bfefff', 50, 3, -20); }
  coinPop(x, y) { this.burst(x, y, 6, '#ffd166', 80, 2.5, 180); }
  muzzle(x, y, color) { this.burst(x, y, 4, color || '#ffe9a8', 200, 2, 0); }

  floatText(x, y, text, color, size = 14) {
    if (this.texts.length > 40) return;
    this.texts.push({ x, y, text, color, size, life: 1.1, maxLife: 1.1 });
  }

  bolt(points, life = 0.18) { this.bolts.push({ points, life, maxLife: life }); }

  addShake(amount) { this.shake = Math.min(14, this.shake + amount); }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt; t.y -= 34 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }
    this.shake = Math.max(0, this.shake - dt * 30);
  }

  draw(ctx) {
    for (const b of this.bolts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
      ctx.strokeStyle = '#e8f6ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#7fe7f2'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * (p.life / p.maxLife)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / t.maxLife * 1.6);
      ctx.font = `bold ${t.size}px "Trebuchet MS", sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(4,20,26,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  shakeOffset() {
    if (this.shake <= 0.2) return { x: 0, y: 0 };
    const s = this.shake;
    return { x: (Math.random() * 2 - 1) * s, y: (Math.random() * 2 - 1) * s };
  }
}
