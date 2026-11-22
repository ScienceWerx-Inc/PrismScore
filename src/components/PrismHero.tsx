'use client';

import React, { useEffect, useRef } from 'react';

/** Shared faceted 3D violet prism logo icon used in header, footer, and report preview. */
export function PrismBrandMark({ className = 'w-10 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prismLeftTop" x1="22" y1="3" x2="10" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#b197fc" />
        </linearGradient>
        <linearGradient id="prismLeftBottom" x1="3" y1="33" x2="22" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="prismRight" x1="22" y1="3" x2="41" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b3df5" />
          <stop offset="100%" stopColor="#3b1d9e" />
        </linearGradient>
      </defs>
      {/* Left-top bright lavender refracting facet */}
      <polygon points="22,3 3,33 22,23" fill="url(#prismLeftTop)" />
      {/* Lower-left deeper violet base facet */}
      <polygon points="3,33 41,33 22,23" fill="url(#prismLeftBottom)" />
      {/* Right rich indigo-purple shadow facet */}
      <polygon points="22,3 41,33 22,23" fill="url(#prismRight)" />
      {/* Crisp white inner prism ridge */}
      <path
        d="M22 3L22 23M22 23L3 33M22 23L41 33M22 3L3 33L41 33L22 3Z"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SPECTRUM_BANDS = [
  { color: 'rgba(239, 68, 68, 0.86)', glow: 'rgba(239, 68, 68, 0.35)', offset: -0.22 },
  { color: 'rgba(249, 115, 22, 0.85)', glow: 'rgba(249, 115, 22, 0.32)', offset: -0.145 },
  { color: 'rgba(250, 204, 21, 0.85)', glow: 'rgba(250, 204, 21, 0.30)', offset: -0.072 },
  { color: 'rgba(34, 197, 94, 0.82)', glow: 'rgba(34, 197, 94, 0.30)', offset: 0.0 },
  { color: 'rgba(6, 182, 212, 0.84)', glow: 'rgba(6, 182, 212, 0.32)', offset: 0.072 },
  { color: 'rgba(59, 130, 246, 0.85)', glow: 'rgba(59, 130, 246, 0.34)', offset: 0.145 },
  { color: 'rgba(139, 92, 246, 0.86)', glow: 'rgba(139, 92, 246, 0.36)', offset: 0.22 },
];

/**
 * Studio 3D glass prism & rainbow light dispersion canvas.
 * Tuned for the dark landing surface; reacts smoothly to cursor movement.
 */
export default function PrismHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let rafId = 0;

    const pointer = { x: 0.55, y: 0.45, tx: 0.55, ty: 0.45 };

    const motes = Array.from({ length: 42 }, (_, idx) => ({
      x: (idx * 0.073) % 1,
      y: (idx * 0.137) % 1,
      r: 0.8 + (idx % 4) * 0.45,
      speed: 0.00018 + (idx % 5) * 0.00006,
      phase: idx * 0.9,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.tx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      pointer.ty = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    const draw = (time: number) => {
      if (!width || !height) {
        if (!reduceMotion) rafId = requestAnimationFrame(draw);
        return;
      }

      pointer.x += (pointer.tx - pointer.x) * 0.055;
      pointer.y += (pointer.ty - pointer.y) * 0.055;

      ctx.clearRect(0, 0, width, height);

      // Prism sits centred vertically in the canvas, in the column right of the hero copy
      const isMobile = width < 768;
      const isWide = width >= 1024;
      const cx = isMobile ? width * 0.76 : isWide ? width * 0.72 : width * 0.82;
      const prismH = isMobile
        ? Math.min(width * 0.42, 190)
        : Math.min(height * 0.6, isWide ? 320 : width * 0.22);
      const halfW = prismH * 0.56;
      const topY = (height - prismH) / 2;
      const baseY = topY + prismH;
      const stageLeft = cx - halfW * 2.4;

      // Studio right-side architectural backdrop shadow so glass + white beam + rainbow pop naturally
      const studioGrad = ctx.createRadialGradient(
        cx - halfW * 0.2,
        topY + prismH * 0.4,
        prismH * 0.15,
        cx,
        topY + prismH * 0.5,
        Math.max(width * 0.55, 420)
      );
      studioGrad.addColorStop(0, 'rgba(91, 61, 245, 0.26)');
      studioGrad.addColorStop(0.5, 'rgba(76, 53, 222, 0.08)');
      studioGrad.addColorStop(1, 'rgba(11, 10, 18, 0)');
      ctx.fillStyle = studioGrad;
      ctx.fillRect(0, 0, width, height);

      // Mouse-driven subtle refraction offsets
      const tiltShift = (pointer.y - 0.5) * 28;
      const spreadFactor = 1 + (pointer.x - 0.5) * 0.16;
      const breathe = reduceMotion ? 0 : Math.sin(time * 0.0014) * 3;

      // Prism vertices (slight 3D perspective)
      const apex = { x: cx + (pointer.x - 0.5) * 4, y: topY + breathe * 0.3 };
      const leftCorner = { x: cx - halfW, y: baseY };
      const rightCorner = { x: cx + halfW, y: baseY };
      const depthDx = halfW * 0.17;
      const depthDy = -prismH * 0.06;

      // Incoming white beam entry point on left face
      const entryX = apex.x * 0.44 + leftCorner.x * 0.56;
      const entryY = apex.y * 0.44 + leftCorner.y * 0.56;
      const sourceX = isMobile ? width * 0.15 : cx - halfW - Math.min(300, width * 0.2);
      const sourceY = entryY - 26 + tiltShift * 0.45;

      // Incoming crisp white beam (soft outer halo + sharp core)
      ctx.save();
      const beamHalo = ctx.createLinearGradient(sourceX, sourceY, entryX, entryY);
      beamHalo.addColorStop(0, 'rgba(255, 255, 255, 0)');
      beamHalo.addColorStop(0.45, 'rgba(255, 255, 255, 0.55)');
      beamHalo.addColorStop(1, 'rgba(255, 255, 255, 0.96)');
      ctx.strokeStyle = beamHalo;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.filter = 'blur(5px)';
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(entryX, entryY);
      ctx.stroke();

      ctx.filter = 'none';
      ctx.strokeStyle = beamHalo;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(entryX, entryY);
      ctx.stroke();
      ctx.restore();

      // Refracted rainbow fan exiting the right face of the prism
      const exitX = apex.x * 0.46 + rightCorner.x * 0.54;
      const exitY = apex.y * 0.46 + rightCorner.y * 0.54;
      const fanLength = Math.max(width - exitX + 120, 420);
      const baseOutAngle = -0.17 + tiltShift * 0.0022;

      ctx.save();
      // Wide soft volumetric dispersion glow behind sharp bands
      SPECTRUM_BANDS.forEach((band, idx) => {
        const wave = reduceMotion ? 0 : Math.sin(time * 0.0018 + idx * 0.7) * 0.006;
        const angle1 = baseOutAngle + (band.offset - 0.042) * spreadFactor + wave;
        const angle2 = baseOutAngle + (band.offset + 0.042) * spreadFactor + wave;

        const startOffset = (idx - 3) * 3.8;
        const sx = exitX - 6;
        const sy = exitY + startOffset;

        const p1x = sx + Math.cos(angle1) * fanLength;
        const p1y = sy + Math.sin(angle1) * fanLength;
        const p2x = sx + Math.cos(angle2) * fanLength;
        const p2y = sy + Math.sin(angle2) * fanLength;

        const grad = ctx.createLinearGradient(sx, sy, (p1x + p2x) * 0.5, (p1y + p2y) * 0.5);
        grad.addColorStop(0, band.color);
        grad.addColorStop(0.55, band.glow);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = grad;
        ctx.filter = 'blur(6px)';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 2.5);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(sx, sy + 2.5);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Internal refracted white-to-spectrum ray inside the glass
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.lineTo(leftCorner.x, leftCorner.y);
      ctx.closePath();
      ctx.clip();

      const internalGrad = ctx.createLinearGradient(entryX, entryY, exitX, exitY);
      internalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      internalGrad.addColorStop(0.65, 'rgba(224, 231, 255, 0.55)');
      internalGrad.addColorStop(1, 'rgba(167, 139, 250, 0.72)');
      ctx.fillStyle = internalGrad;
      ctx.beginPath();
      ctx.moveTo(entryX, entryY - 3);
      ctx.lineTo(exitX + 6, exitY - 15);
      ctx.lineTo(exitX + 6, exitY + 15);
      ctx.lineTo(entryX, entryY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3D Glass Prism Body & Bevels
      ctx.save();
      // Back 3D bevel face (right/depth edge)
      const backGrad = ctx.createLinearGradient(apex.x, apex.y, rightCorner.x + depthDx, rightCorner.y + depthDy);
      backGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      backGrad.addColorStop(0.5, 'rgba(171, 156, 248, 0.16)');
      backGrad.addColorStop(1, 'rgba(18, 16, 28, 0.55)');
      ctx.fillStyle = backGrad;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(apex.x + depthDx * 0.55, apex.y - 2);
      ctx.lineTo(rightCorner.x + depthDx, rightCorner.y + depthDy);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.closePath();
      ctx.fill();

      // Main front glass triangle (translucent studio shading)
      const glassGrad = ctx.createLinearGradient(leftCorner.x, apex.y, rightCorner.x, baseY);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
      glassGrad.addColorStop(0.32, 'rgba(207, 198, 251, 0.1)');
      glassGrad.addColorStop(0.62, 'rgba(76, 53, 222, 0.14)');
      glassGrad.addColorStop(1, 'rgba(11, 10, 18, 0.4)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.lineTo(leftCorner.x, leftCorner.y);
      ctx.closePath();
      ctx.fill();

      // Crisp specular bevel reflection strip along left edge
      const leftBevel = ctx.createLinearGradient(leftCorner.x, baseY, apex.x, apex.y);
      leftBevel.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      leftBevel.addColorStop(0.5, 'rgba(255, 255, 255, 0.78)');
      leftBevel.addColorStop(1, 'rgba(255, 255, 255, 0.92)');
      ctx.fillStyle = leftBevel;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(leftCorner.x, leftCorner.y);
      ctx.lineTo(leftCorner.x + halfW * 0.14, leftCorner.y - 3);
      ctx.lineTo(apex.x + 2, apex.y + 18);
      ctx.closePath();
      ctx.fill();

      // Subtle bottom inner glass reflection wedge
      const bottomBevel = ctx.createLinearGradient(leftCorner.x, baseY, rightCorner.x, baseY);
      bottomBevel.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      bottomBevel.addColorStop(0.5, 'rgba(203, 213, 225, 0.18)');
      bottomBevel.addColorStop(1, 'rgba(139, 92, 246, 0.35)');
      ctx.fillStyle = bottomBevel;
      ctx.beginPath();
      ctx.moveTo(leftCorner.x, leftCorner.y);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.lineTo(rightCorner.x - halfW * 0.12, baseY - 12);
      ctx.lineTo(leftCorner.x + halfW * 0.14, baseY - 8);
      ctx.closePath();
      ctx.fill();

      // Crisp outer crystal strokes + subtle cyan/violet chromatic rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(leftCorner.x, leftCorner.y);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(171, 156, 248, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(apex.x + depthDx * 0.55, apex.y - 2);
      ctx.lineTo(rightCorner.x + depthDx, rightCorner.y + depthDy);
      ctx.lineTo(rightCorner.x, rightCorner.y);
      ctx.stroke();
      ctx.restore();

      // Floating light motes catching the prism & rainbow beam
      motes.forEach((m) => {
        if (!reduceMotion) {
          m.x += m.speed * 1.4;
          if (m.x > 1) m.x = 0.38;
        }
        const mx = m.x * width;
        const my = (0.18 + m.y * 0.58) * height + Math.sin(time * 0.002 + m.phase) * 4;
        if (mx < stageLeft) return;
        const alpha = 0.25 + 0.35 * Math.sin(time * 0.003 + m.phase);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.08, alpha).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduceMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
