// The hero environment: a dark metal lot suspended in space, lit from inside by
// the ember, with orbits, drifting particles and a floor grid dissolving in fog.
//
// Plain three.js, lazy-loaded. The render loop runs only while the canvas is on
// screen and the tab is visible, and renders a single still frame when the
// visitor prefers reduced motion.
import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Props = { progress: MotionValue<number>; low: boolean; still: boolean };

const EMBER = 0xff8a00;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,179,71,1)');
  g.addColorStop(0.25, 'rgba(255,138,0,0.55)');
  g.addColorStop(1, 'rgba(255,138,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function orbit(radius: number, opacity: number) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
  const geo = new THREE.BufferGeometry().setFromPoints(
    curve.getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y)),
  );
  return new THREE.LineLoop(
    geo,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity }),
  );
}

export default function HeroScene({ progress, low, still }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !low,
        alpha: true,
        powerPreference: low ? 'low-power' : 'high-performance',
      });
    } catch {
      el.dataset.webgl = 'unavailable';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.055);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.9;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.2, 11);

    // ---- the lot
    const world = new THREE.Group();
    scene.add(world);

    const lot = new THREE.Group();
    world.add(lot);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 0),
      new THREE.MeshStandardMaterial({
        color: 0x2b2b2b,
        metalness: 0.88,
        roughness: 0.26,
        flatShading: true,
      }),
    );
    lot.add(shell);

    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.25, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 }),
    );
    lot.add(cage);

    const seams = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.56, 0)),
      new THREE.LineBasicMaterial({ color: EMBER, transparent: true, opacity: 0.35 }),
    );
    lot.add(seams);

    const glowTex = glowTexture();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.setScalar(7.5);
    glow.position.z = -1.2;
    world.add(glow);

    // ---- orbits and a satellite
    const orbits = new THREE.Group();
    orbits.rotation.set(0.42, 0, -0.18);
    world.add(orbits);
    const ringA = orbit(3.3, 0.12);
    const ringB = orbit(4.4, 0.06);
    ringB.rotation.x = 0.25;
    orbits.add(ringA, ringB);
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({ color: EMBER }),
    );
    orbits.add(satellite);
    const satGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    satGlow.scale.setScalar(0.6);
    satellite.add(satGlow);

    // ---- particles
    const count = low ? 260 : 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const white = new THREE.Color(0xffffff);
    const ember = new THREE.Color(EMBER);
    for (let i = 0; i < count; i += 1) {
      const r = 5 + Math.random() * 11;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 3;
      const c = Math.random() < 0.08 ? ember : white;
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: low ? 0.035 : 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    // ---- floor
    const grid = new THREE.GridHelper(60, 60, 0x2a2a2a, 0x161616);
    grid.position.y = -3.4;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    scene.add(grid);

    // ---- light
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const key = new THREE.PointLight(EMBER, 70, 24, 1.5);
    key.position.set(-3.2, 1.2, 3.6);
    scene.add(key);
    const rim = new THREE.PointLight(0xffb347, 40, 18, 1.6);
    rim.position.set(2.6, -1.6, -2.6);
    scene.add(rim);
    const front = new THREE.PointLight(0xfff1e0, 14, 14, 1.8);
    front.position.set(1.5, 2.5, 6);
    scene.add(front);
    const fill = new THREE.DirectionalLight(0xffffff, 1.6);
    fill.position.set(4, 6, 5);
    scene.add(fill);

    // ---- sizing
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / Math.max(h, 1);
      // Wide screens: the object sits right of the headline. Narrow: centred, further away.
      camera.position.z = w < 700 ? 15 : 11;
      world.position.x = w >= 1024 ? 2.9 : w >= 700 ? 1.8 : 0;
      world.position.y = w < 700 ? 2.2 : 0.35;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ---- pointer parallax, desktop only
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // ---- loop
    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    let running = false;

    const frame = () => {
      const t = clock.getElapsedTime();
      const p = progress.get();

      lot.rotation.y = t * 0.12;
      lot.rotation.x = Math.sin(t * 0.21) * 0.18;
      lot.position.y = Math.sin(t * 0.5) * 0.08 + p * 1.1;
      cage.rotation.y = -t * 0.05;
      orbits.rotation.y = t * 0.03;
      const a = t * 0.35;
      satellite.position.set(Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3);
      particles.rotation.y = t * 0.008;
      glow.material.opacity = 0.5 + Math.sin(t * 0.8) * 0.06;
      seams.material.opacity = 0.28 + Math.sin(t * 0.8) * 0.08;

      world.rotation.y += (pointer.x * 0.12 - world.rotation.y) * 0.04;
      world.rotation.x += (pointer.y * 0.06 - world.rotation.x) * 0.04;

      // Scroll pulls the camera back and down: the object recedes into depth.
      camera.position.y = 0.2 - p * 1.4;
      camera.lookAt(0, p * 0.6, 0);
      grid.position.z = p * 3;

      renderer.render(scene, camera);
    };

    const loop = () => {
      frame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || still) return;
      running = true;
      clock.start();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    if (still) frame();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && document.visibilityState === 'visible') start();
      else stop();
    });
    io.observe(el);
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && visible) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    el.dataset.webgl = 'ready';

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose?.();
      });
      glowTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, low, still]);

  return <div ref={host} className="absolute inset-0" />;
}
