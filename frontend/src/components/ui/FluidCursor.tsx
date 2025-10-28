import { useEffect, useRef } from 'react';

/**
 * Falling Particles Effect
 * Small particles falling from top - Optimized for performance
 */
export default function FluidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Particle system for falling effect
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      color: string;
    }> = [];

    // Resize canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate gradient color
    const getColor = () => {
      const colors = [
        'rgba(99, 102, 241, 0.6)',   // Indigo
        'rgba(139, 92, 246, 0.6)',   // Purple
        'rgba(236, 72, 153, 0.6)',   // Pink
        'rgba(59, 130, 246, 0.6)',   // Blue
        'rgba(168, 85, 247, 0.6)',   // Purple
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Create initial particles
    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 3 + 1, // 1-4px
        speed: Math.random() * 2 + 1, // 1-3px per frame
        opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
        color: getColor(),
      };
    };

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      const particle = createParticle();
      particle.y = Math.random() * canvas.height;
      particles.push(particle);
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.y += p.speed;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Reset particle if it goes off screen
        if (p.y > canvas.height + 10) {
          particles[i] = createParticle();
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-10"
      style={{ opacity: 0.8 }}
    />
  );
}
