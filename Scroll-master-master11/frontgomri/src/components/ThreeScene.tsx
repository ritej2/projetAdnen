import React, { useEffect, useRef } from 'react';

interface ParticleNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
}

export const Hero3DCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 680);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 680;
    };

    window.addEventListener('resize', handleResize);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouse.targetY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const palette = ['#38bdf8', '#6366f1', '#a855f7', '#10b981', '#60a5fa'];
    const numNodes = 68;
    const nodes: ParticleNode[] = [];
    const sphereRadius = Math.min(width, height) * 0.36;

    for (let i = 0; i < numNodes; i++) {
      const phi = Math.acos(-1 + (2 * i) / numNodes);
      const theta = Math.sqrt(numNodes * Math.PI) * phi;
      nodes.push({
        x: sphereRadius * Math.cos(theta) * Math.sin(phi),
        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
        z: sphereRadius * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.25,
        radius: 2 + Math.random() * 2.6,
        color: palette[i % palette.length],
      });
    }

    let angleY = 0;
    let angleX = 0.2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      angleY += 0.0038 + mouse.x * 0.008;
      angleX += (mouse.y * 0.35 - angleX) * 0.04;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const centerX = width * 0.65;
      const centerY = height * 0.48;
      const fov = 520;

      // Ambient 3D Core Glow
      const grad = ctx.createRadialGradient(
        centerX + mouse.x * 28,
        centerY + mouse.y * 28,
        10,
        centerX,
        centerY,
        sphereRadius * 1.35
      );
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      grad.addColorStop(0.45, 'rgba(99, 102, 241, 0.12)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const projected = nodes.map((node) => {
        // Rotate Y
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;
        // Rotate X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        const scale = fov / (fov + z2 + 220);
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          pz: z2,
          scale,
          node,
        };
      });

      // Sort back to front
      projected.sort((a, b) => b.pz - a.pz);

      // Draw 3D constellation edges
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 115) {
            const alpha = (1 - dist / 115) * 0.28 * a.scale;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      // Draw 3D nodes
      for (const p of projected) {
        const r = Math.max(1.2, p.node.radius * p.scale * 1.3);
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fillStyle = p.node.color;
        ctx.shadowColor = p.node.color;
        ctx.shadowBlur = 12 * p.scale;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export const Tilt3DCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
}> = ({ children, className = '', style = {}, intensity = 8 }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
      2
    )}deg) translateZ(6px)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

  return (
    <div
      ref={cardRef}
      className={`jf-tilt-3d ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

