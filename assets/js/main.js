(function () {
  const ensureInteractiveBackground = () => {
    let canvas = document.querySelector(".site-bg-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "site-bg-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }

    if (!document.querySelector(".site-bg-tint")) {
      const tint = document.createElement("div");
      tint.className = "site-bg-tint";
      tint.setAttribute("aria-hidden", "true");
      document.body.prepend(tint);
    }

    return canvas;
  };

  const initInteractiveBackground = () => {
    const canvas = ensureInteractiveBackground();
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      tx: window.innerWidth * 0.5,
      ty: window.innerHeight * 0.5,
      active: false
    };

    let width = 0;
    let height = 0;
    let rafId = null;
    let lastTime = 0;
    const particles = [];

    const particleCount = () => {
      const densityTarget = Math.floor((window.innerWidth * window.innerHeight) / 28000);
      return Math.min(90, Math.max(42, densityTarget));
    };

    const randomBetween = (min, max) => min + Math.random() * (max - min);

    const resetParticles = () => {
      particles.length = 0;
      const count = particleCount();
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: randomBetween(-0.28, 0.28),
          vy: randomBetween(-0.22, 0.22),
          r: randomBetween(0.9, 2.6),
          hue: randomBetween(208, 224)
        });
      }
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetParticles();
    };

    const drawBackdrop = (time) => {
      const base = context.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "rgba(8, 11, 19, 0.92)");
      base.addColorStop(0.45, "rgba(10, 14, 24, 0.8)");
      base.addColorStop(1, "rgba(7, 10, 16, 0.95)");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);

      const waveX = width * (0.25 + Math.sin(time * 0.00018) * 0.1);
      const waveY = height * (0.3 + Math.cos(time * 0.00022) * 0.1);
      const glow = context.createRadialGradient(waveX, waveY, 0, waveX, waveY, Math.max(width, height) * 0.7);
      glow.addColorStop(0, "rgba(99, 132, 207, 0.28)");
      glow.addColorStop(1, "rgba(99, 132, 207, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const pointerGlow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
      pointerGlow.addColorStop(0, "rgba(143, 167, 219, 0.2)");
      pointerGlow.addColorStop(1, "rgba(143, 167, 219, 0)");
      context.fillStyle = pointerGlow;
      context.fillRect(0, 0, width, height);
    };

    const drawParticles = (delta, time) => {
      context.save();
      context.globalCompositeOperation = "lighter";
      const waveTimeX = time * 0.00006;
      const waveTimeY = time * 0.00004;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 46000) {
            const influence = (1 - distSq / 46000) * 0.055;
            p.vx -= dx * influence * 0.0008;
            p.vy -= dy * influence * 0.0008;
          }

          p.vx += Math.sin((p.y + waveTimeX) * 0.005) * 0.0018;
          p.vy += Math.cos((p.x + waveTimeY) * 0.005) * 0.0014;
        }

        p.x += p.vx * delta * 60;
        p.y += p.vy * delta * 60;
        p.vx *= 0.994;
        p.vy *= 0.994;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        context.beginPath();
        context.fillStyle = `hsla(${p.hue}, 76%, 70%, 0.54)`;
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }

      context.strokeStyle = "rgba(123, 159, 223, 0.14)";
      context.lineWidth = 1;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 105) {
            context.globalAlpha = 1 - distance / 105;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      context.restore();
      context.globalAlpha = 1;
    };

    const drawFrame = (time) => {
      const delta = Math.min(0.033, (time - lastTime) / 1000 || 0.016);
      lastTime = time;

      pointer.x += (pointer.tx - pointer.x) * (pointer.active ? 0.12 : 0.025);
      pointer.y += (pointer.ty - pointer.y) * (pointer.active ? 0.12 : 0.025);

      drawBackdrop(time);
      drawParticles(delta, time);

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const handlePointerMove = (event) => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.tx = width * 0.5;
      pointer.ty = height * 0.5;
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    if (prefersReducedMotion) {
      drawBackdrop(0);
      drawParticles(0.016, 0);
      return;
    }

    rafId = window.requestAnimationFrame(drawFrame);

    window.addEventListener("beforeunload", () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    });
  };

  initInteractiveBackground();

  const toggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  const closeSidebar = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };

  const openSidebar = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.classList.add("no-scroll");
  };

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1000) {
        closeSidebar();
      }
    });
  }

  document.querySelectorAll("[data-stagger]").forEach((element, index) => {
    element.style.animationDelay = `${index * 80}ms`;
  });
})();
