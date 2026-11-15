// Particles and floating text: the juice. Bursts on death and build,
// lightning arcs, and gold popups that drift up and fade.

import { range } from './rng.js';

export class Particles {
  constructor(rng) {
    this.rng = rng;
    this.list = [];
    this.texts = [];
    this.arcs = [];
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const sp = range(this.rng, 40, 190);
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: range(this.rng, 0.35, 0.8), max: 0.8,
        size: range(this.rng, 2, 5), color,
      });
    }
  }

  arc(x1, y1, x2, y2, color) {
    this.arcs.push({ x1, y1, x2, y2, color, life: 0.14, max: 0.14, seed: this.rng() });
  }

  text(x, y, str, color) {
    this.texts.push({ x, y, str, color, life: 1.1, max: 1.1 });
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 34 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter((a) => a.life > 0);
  }

  draw(ctx) {
    for (const a of this.arcs) {
      const alpha = a.life / a.max;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1);
      const mx = (a.x1 + a.x2) / 2 + (a.seed - 0.5) * 60;
      const my = (a.y1 + a.y2) / 2 + (a.seed - 0.5) * 60;
      ctx.lineTo(mx, my);
      ctx.lineTo(a.x2, a.y2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of this.list) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.max);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.restore();
  }
}
