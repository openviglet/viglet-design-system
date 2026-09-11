import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ---------- Avatar Viglet (abstrato) ----------
// Um sol: núcleo de luz com o gradiente do logo dentro de uma esfera de vidro.
// O V, extrapolado para triângulo, vira a vestimenta: o núcleo é facetado.
// A expressão é o brilho, a órbita, o pulso e as brasas.
// Estados: idle | working | success | error | attention
const PALETTE = {
  // tons mais baixos e menos saturados: luz de abajur, não de holofote
  idle:      { center: 0xe39a4a, rim: 0xa8321a, glow: 0.22 },
  working:   { center: 0xe8a65a, rim: 0xa8321a, glow: 0.32 },
  success:   { center: 0xf1bf7c, rim: 0xc0532a, glow: 0.55 },
  error:     { center: 0x6e1e10, rim: 0x2a0704, glow: 0.03 },
  attention: { center: 0xecb46a, rim: 0xb43e1e, glow: 0.42 },
};

const vert = `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const frag = `
  uniform vec3 uCenter; uniform vec3 uRim; uniform float uGlow; uniform float uTime;
  varying vec3 vN; varying vec3 vV;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    float f = 1.0 - max(dot(vN, vV), 0.0);
    float facet = hash(floor(vN * 40.0));                  // valor fixo por faceta
    float n = 0.9 + 0.14 * facet + 0.06 * sin(uTime * 0.8 + facet * 6.28); // cada faceta respira em ritmo próprio
    vec3 col = mix(uCenter, uRim, smoothstep(0.1, 0.92, f)) * n;
    col += vec3(1.0, 0.9, 0.7) * smoothstep(0.7, 0.0, f) * uGlow * 0.6;
    col *= 1.0 - 0.25 * smoothstep(0.85, 1.0, f);          // limbo mais escuro
    gl_FragColor = vec4(col, 1.0);
  }`;

function radialTexture(stops) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function makeEnvironment(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x15181d, side: THREE.BackSide })));
  const softbox = (w, h, x, y, z, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  softbox(6, 3, -5, 6, 4, 0xffffff);
  softbox(3, 6, 6, 1, -3, 0x8a94a6);
  softbox(8, 1, 0, -6, 2, 0x4a2a14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env).texture;
  pmrem.dispose();
  return tex;
}

function VigletAvatar({ state, compact, activity = 0, unread = false }) {
  const mountRef = useRef(null);
  const stateRef = useRef(state);
  const compactRef = useRef(compact);
  useEffect(() => { compactRef.current = compact; }, [compact]);
  const tickRef = useRef(0);
  useEffect(() => { if (activity) tickRef.current = performance.now(); }, [activity]);
  const unreadRef = useRef(unread);
  useEffect(() => { unreadRef.current = unread; }, [unread]);
  const stateStart = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    stateStart.current = performance.now();
  }, [state]);

  useEffect(() => {
    const el = mountRef.current;
    const W = el.clientWidth, H = el.clientHeight;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 5.8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const envMap = makeEnvironment(renderer);

    const avatar = new THREE.Group();

    // gás: nuvem escura e difusa atrás do sol. Dá fundo à luz aditiva em qualquer tema
    // e nunca tem contorno: o gradiente vai a zero antes da borda do canvas.
    const gasTex = radialTexture([[0, "rgba(9,11,15,0.96)"], [0.4, "rgba(9,11,15,0.8)"], [0.68, "rgba(9,11,15,0.32)"], [1, "rgba(9,11,15,0)"]]);
    const gas = new THREE.Group();
    const gasA = new THREE.Sprite(new THREE.SpriteMaterial({ map: gasTex, transparent: true, depthWrite: false, opacity: 1 }));
    const gasB = new THREE.Sprite(new THREE.SpriteMaterial({ map: gasTex, transparent: true, depthWrite: false, opacity: 0.55 }));
    gasA.scale.setScalar(2.5); gasB.scale.set(2.9, 2.2, 1);
    gasA.position.z = -0.9; gasB.position.z = -1.0;
    gas.add(gasA, gasB);
    gas.renderOrder = -1;
    scene.add(gas);

    // núcleo de luz
    const uniforms = {
      uCenter: { value: new THREE.Color(PALETTE.idle.center) },
      uRim: { value: new THREE.Color(PALETTE.idle.rim) },
      uGlow: { value: PALETTE.idle.glow },
      uTime: { value: 0 },
    };
    // o triângulo (o V extrapolado) vira a vestimenta do sol: facetas planas
    const coreGeo = new THREE.IcosahedronGeometry(0.62, 2).toNonIndexed();
    coreGeo.computeVertexNormals(); // não indexada => normais por face (facetado)
    const core = new THREE.Mesh(
      coreGeo,
      new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag })
    );
    avatar.add(core);

    // arestas das facetas, como costura de luz
    const seams = new THREE.LineSegments(
      new THREE.WireframeGeometry(coreGeo),
      new THREE.LineBasicMaterial({ color: 0xf1bf7c, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    seams.scale.setScalar(1.003);
    core.add(seams);

    // halo aditivo em volta do núcleo
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture([[0, "rgba(235,160,70,0.55)"], [0.35, "rgba(200,90,30,0.2)"], [1, "rgba(160,50,10,0)"]]),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    }));
    halo.scale.setScalar(2.6);
    avatar.add(halo);

    // esfera de vidro que envolve tudo
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
        envMap, envMapIntensity: 1.2, transparent: true, opacity: 0.08, depthWrite: false,
      })
    );
    shell.renderOrder = 2;
    avatar.add(shell);

    // anel de órbita (processando)
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.86, 0.008, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    orbit.rotation.x = 1.1;
    avatar.add(orbit);

    // pulso (publicado): anel que se expande e some
    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.01, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pulse.visible = false;
    avatar.add(pulse);

    // brasas subindo do núcleo
    const NP = 40;
    const pPos = new Float32Array(NP * 3), pVel = new Float32Array(NP);
    for (let i = 0; i < NP; i++) {
      pPos.set([(Math.random() - 0.5) * 1.2, Math.random() * 1.8 - 0.2, (Math.random() - 0.5) * 1.2], i * 3);
      pVel[i] = 0.002 + Math.random() * 0.004;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xffd166, size: 0.035, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false,
      map: radialTexture([[0, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]]),
    }));
    avatar.add(particles);

    const light = new THREE.PointLight(0xffb347, 1.5, 7, 2);
    avatar.add(light);
    scene.add(avatar);

    // chão: poça de luz e sombra de contato
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({
      map: radialTexture([[0, "rgba(220,140,60,0.22)"], [1, "rgba(220,140,60,0)"]]), transparent: true, depthWrite: false,
    }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -1.42; scene.add(pool);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({
      map: radialTexture([[0, "rgba(0,0,0,0.6)"], [1, "rgba(0,0,0,0)"]]), transparent: true, depthWrite: false,
    }));
    contact.rotation.x = -Math.PI / 2; contact.position.y = -1.41; scene.add(contact);

    // anel de atenção
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0 })
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const mouse = { x: 0, y: 0 };
    let lastMove = -1e9, energy = 0, animTime = 0, lastNow = performance.now(), cooldown = 60;
    const onMove = (ev) => {
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((ev.clientY / window.innerHeight) * 2 - 1);
      lastMove = performance.now();
      cooldown = 60;
    };
    window.addEventListener("mousemove", onMove);

    const cCenter = new THREE.Color(), cRim = new THREE.Color();
    const lerp = (a, b, t) => a + (b - a) * t;
    // aproxima devagar E com teto de velocidade (rad/s): o mouse pode ser rápido, o sol nunca é
    const MAX_TURN = 0.05;                        // ~3° por segundo, no máximo
    const approach = (cur, target, ease, dt) => {
      const step = (target - cur) * ease;
      const cap = MAX_TURN * dt;
      return cur + Math.max(-cap, Math.min(cap, step));
    };
    const smooth = { x: 0, y: 0 }; // mouse filtrado, para não pegar solavancos
    let lastCompact = compact, raf;

    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      const t = now / 1000;
      const s = stateRef.current;
      const e = (now - stateStart.current) / 1000;
      const p = PALETTE[s];

      // energia: 1 enquanto o mouse se move, cai a 0 ~1,2 s depois de parar.
      // Movimento ambiente é multiplicado por ela; eventos do sistema passam por fora.
      const dt = Math.min((now - lastNow) / 1000, 0.05); lastNow = now;
      const moving = now - lastMove < 1200;
      energy = lerp(energy, moving && !reduced ? 1 : 0, moving ? 0.008 : 0.01); // acorda em ~4 s
      animTime += dt * energy * 0.25;           // relógio da animação ambiente: 25% do tempo real
      const sinceTick = (now - tickRef.current) / 1000;
      if (compactRef.current !== lastCompact) { lastCompact = compactRef.current; cooldown = 60; }
      const settling = Math.abs(camera.position.z - (compactRef.current ? 4.7 : 5.8)) > 0.01;
      const active = s !== "idle" || sinceTick < 2.2 || unreadRef.current || energy > 0.004 || settling;
      if (active) cooldown = 60;
      if (cooldown <= 0) return;      // parado de verdade: não renderiza
      cooldown--;

      uniforms.uTime.value = animTime;
      // compacto: câmera mais perto e sem chão
      const cz = compactRef.current ? 4.7 : 5.8, cy = compactRef.current ? 0.02 : 0.4;
      camera.position.z = lerp(camera.position.z, cz, 0.08);
      camera.position.y = lerp(camera.position.y, cy, 0.08);
      camera.lookAt(0, compactRef.current ? 0.05 : 0, 0);
      pool.visible = contact.visible = !compactRef.current;
      gasA.material.rotation = animTime * 0.03;
      gasB.material.rotation = -animTime * 0.02;
      const gs = 1 + Math.sin(animTime * 0.5) * 0.03 * energy;
      gasA.scale.setScalar(2.5 * gs);
      core.rotation.y = animTime * 0.06;
      core.rotation.x = 0.35;

      let glow = p.glow, scale = 1;
      let ringY = -1.3, ringOpacity = 0;
      glow += Math.sin(animTime * 0.9) * 0.05 * energy;
      // batida curta quando o conteúdo é editado: o sol "escuta" a digitação
      const tick = sinceTick < 1.8 ? Math.sin(Math.min(sinceTick / 1.8, 1) * Math.PI) * 0.14 : 0;
      glow += tick;

      if (s === "working") glow += Math.sin(t * 2.2) * 0.06;   // evento: anima mesmo sem mouse
      if (s === "success") {
        const k = Math.min(e / 1.4, 1), ease = 1 - Math.pow(1 - k, 3);
        scale = 1 + Math.sin(ease * Math.PI) * 0.06;
        if (e > 1.4) glow = lerp(p.glow, PALETTE.idle.glow + 0.25, Math.min((e - 1.4) / 2.0, 1));
      }
      if (s === "error") { scale = 0.94; }
      if (s === "attention") {
        const k = Math.min(e / 2.4, 1);
        ringY = lerp(-1.3, 0.25, 1 - Math.pow(1 - k, 2));
        ringOpacity = k < 1 ? 0.7 : 0.7 * Math.max(0, 1 - (e - 2.4) / 2.5);
      }

      cCenter.set(p.center); cRim.set(p.rim);
      uniforms.uCenter.value.lerp(cCenter, 0.03);
      uniforms.uRim.value.lerp(cRim, 0.03);
      uniforms.uGlow.value = lerp(uniforms.uGlow.value, glow, 0.04);
      light.color.copy(uniforms.uCenter.value);
      light.intensity = lerp(light.intensity, 0.2 + uniforms.uGlow.value * 1.1, 0.04);
      halo.material.opacity = lerp(halo.material.opacity, 0.15 + uniforms.uGlow.value * 0.6, 0.04);
      halo.scale.setScalar(lerp(halo.scale.x, 2.0 + uniforms.uGlow.value * 0.8, 0.04));
      core.scale.setScalar(lerp(core.scale.x, 0.92 + uniforms.uGlow.value * 0.2, 0.04));

      // expressão: órbita em "processando", pulso em "publicado"
      // resposta esperando enquanto está recolhido: a órbita fica visível, baixa e lenta
      const unreadOrbit = unreadRef.current ? 0.28 + Math.sin(t * 0.8) * 0.08 : 0;
      orbit.material.opacity = lerp(orbit.material.opacity, s === "working" ? 0.55 : unreadOrbit, 0.08);
      orbit.rotation.z += 0.005 * (s === "working" ? 1 : energy);
      orbit.rotation.x = 1.1 + Math.sin(animTime * 0.6) * 0.15;
      if (s === "success" && e < 2.6) {
        pulse.visible = true;
        pulse.scale.setScalar(0.6 + e * 0.6);
        pulse.material.opacity = 0.6 * (1 - e / 2.6);
      } else pulse.visible = false;
      // brasas subindo lentamente
      for (let i = 0; i < NP; i++) {
        pPos[i * 3 + 1] += pVel[i] * 0.2 * (0.4 + uniforms.uGlow.value) * (s === "success" || s === "attention" ? 1 : energy);
        if (pPos[i * 3 + 1] > 1.6) { pPos[i * 3 + 1] = -0.2; pPos[i * 3] = (Math.random() - 0.5) * 1.2; pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2; }
      }
      pGeo.attributes.position.needsUpdate = true;
      particles.material.opacity = lerp(particles.material.opacity, 0.1 + uniforms.uGlow.value * 0.45, 0.08);
      particles.material.color.copy(uniforms.uCenter.value);

      seams.material.opacity = lerp(seams.material.opacity, 0.05 + uniforms.uGlow.value * 0.25, 0.08);

      // acompanha o cursor
      smooth.x = lerp(smooth.x, mouse.x, 0.005);
      smooth.y = lerp(smooth.y, mouse.y, 0.005);
      const ry = reduced ? 0 : Math.sin(animTime * 0.35) * 0.03 + smooth.x * 0.1;
      const rx = reduced ? 0 : -smooth.y * 0.06;
      avatar.rotation.y = approach(avatar.rotation.y, ry, 0.008, dt);
      avatar.rotation.x = approach(avatar.rotation.x, rx, 0.008, dt);
      avatar.position.y = Math.sin(animTime * 0.7) * 0.02 * energy;

      const sc = lerp(avatar.scale.x, scale + tick * 0.08, 0.06);
      avatar.scale.setScalar(sc);
      contact.scale.setScalar(sc);
      pool.material.opacity = 0.4 + uniforms.uGlow.value * 0.6;

      ring.position.y = ringY;
      ring.material.opacity = lerp(ring.material.opacity, ringOpacity, 0.15);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
      cooldown = 60;
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

// ---------- Aplicação ----------
const initialPages = [
  { id: 1, title: "Página inicial", slug: "/", status: "publicada" },
  { id: 2, title: "Governança e transparência", slug: "/governanca", status: "publicada" },
  { id: 3, title: "Resultados do terceiro trimestre", slug: "/resultados-3t", status: "rascunho" },
  { id: 4, title: "", slug: "/comunicado", status: "rascunho" },
];

const STATE_LABEL = {
  idle: "Estável",
  working: "Processando",
  success: "Publicado",
  error: "Ação necessária",
  attention: "Nova entrada",
};

// Legenda: o texto aparece sendo digitado, sem caixa, como legenda de filme
function Caption({ text, className = "" }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!text) { setShown(""); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setShown(text); return; }
    setShown("");
    let i = 0;
    const step = Math.max(14, Math.min(34, 1400 / text.length)); // textos longos digitam mais rápido
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, step);
    return () => clearInterval(id);
  }, [text]);
  if (!text) return null;
  return (
    <div className={"caption " + className} aria-live="polite">
      {shown}<span className="caret" aria-hidden="true" />
    </div>
  );
}

async function askViglet(history, context) {
  const system = `Você é o assistente do Viglet, um CMS/CRM. Responda em português, de forma curta e direta (no máximo 3 frases), como um colega experiente. Você tem acesso ao contexto abaixo.
Contexto:
- Página em edição: título "${context.title || "(sem título)"}", endereço ${context.slug}, status ${context.status}
- Conteúdo: ${context.body}
- Leads recentes: ${context.leads.map((l) => `${l.name} (${l.org}, ${l.src})`).join("; ")}
Responda SOMENTE com JSON válido, sem markdown, no formato: {"reply": "texto", "suggestedTitle": "título ou null"}. Preencha suggestedTitle apenas quando o usuário pedir um título.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: history.map((m) => ({ role: m.role, content: m.text })),
    }),
  });
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || "").join("\n");
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { reply: text || "Não consegui responder agora.", suggestedTitle: null };
  }
}

export default function App() {
  const [pages, setPages] = useState(initialPages);
  const [selectedId, setSelectedId] = useState(3);
  const [mode, setMode] = useState("idle");
  const [line, setLine] = useState(null);
  const [body, setBody] = useState("A receita líquida ficou em linha com o trimestre anterior. A margem operacional avançou 2,4 pontos percentuais, refletindo a renegociação de contratos logísticos concluída em julho.");
  const [leads, setLeads] = useState([
    { name: "Ricardo Tavares", org: "Grupo Meridiano", src: "indicação" },
    { name: "Helena Cruz", org: "Banco Atlas", src: "formulário do site" },
  ]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  // tema: "auto" segue o sistema; o botão alterna auto -> claro -> escuro
  const [themePref, setThemePref] = useState("auto");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const theme = themePref === "auto" ? (systemDark ? "dark" : "light") : themePref;
  const [activity, setActivity] = useState(0);
  const [unread, setUnread] = useState(false);
  const lastTick = useRef(0);
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; if (open) setUnread(false); }, [open]);
  const touch = () => {
    const now = performance.now();
    if (now - lastTick.current > 220) { lastTick.current = now; setActivity((a) => a + 1); }
  };
  const selectPage = (p) => {
    setSelectedId(p.id);
    touch();
    clearTimeout(timer.current);
    setLine(`${p.title || "Sem título"} · ${p.status}`);
    timer.current = setTimeout(() => setLine(null), 2500);
  };
  const timer = useRef(null);
  const listRef = useRef(null);

  const page = pages.find((p) => p.id === selectedId);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const settle = (ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setMode("idle"); setLine(null); }, ms);
  };

  const updateTitle = (title) => {
    touch();
    setPages((ps) => ps.map((p) => (p.id === selectedId ? { ...p, title } : p)));
  };

  const publish = () => {
    if (!page.title.trim()) {
      setMode("error");
      setLine("Título obrigatório para publicar.");
      return settle(4000);
    }
    setPages((ps) => ps.map((p) => (p.id === selectedId ? { ...p, status: "publicada" } : p)));
    setMode("success");
    setLine(`${page.slug} publicado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`);
    settle(3500);
  };

  const newLead = () => {
    const lead = { name: "Mariana Lopes", org: "Lumen Arquitetura", src: "formulário do site" };
    setLeads((l) => [lead, ...l]);
    setMode("attention");
    setLine(`${lead.name}, ${lead.org}. Origem: ${lead.src}.`);
    settle(4500);
  };

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setOpen(true);
    const history = [...messages, { role: "user", text: clean }];
    setMessages(history);
    setDraft("");
    setBusy(true);
    clearTimeout(timer.current);
    setLine(null);
    setMode("working");
    try {
      const out = await askViglet(history, { ...page, body, leads });
      setMessages((m) => [...m, { role: "assistant", text: out.reply, suggestedTitle: out.suggestedTitle || null }]);
      setMode("idle");
      if (!openRef.current) {
        setUnread(true);
        setLine(out.reply);
        timer.current = setTimeout(() => setLine(null), 6000);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Não consegui falar com o serviço agora. Tente de novo." }]);
      setMode("error");
      settle(3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={"app " + theme}>
      <style>{css}</style>

      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark" />
          Viglet
        </div>

        <div className="group">Páginas</div>
        {pages.map((p) => (
          <button
            key={p.id}
            className={"row" + (p.id === selectedId ? " active" : "")}
            onClick={() => selectPage(p)}
          >
            <span style={{ opacity: p.title ? 1 : 0.4 }}>{p.title || "Sem título"}</span>
            <span className={"dot " + p.status} title={p.status} />
          </button>
        ))}

        <div className="group" style={{ marginTop: 30 }}>Leads recentes</div>
        {leads.slice(0, 3).map((l, i) => (
          <div key={i} className="lead">
            <div>{l.name}</div>
            <div className="muted">{l.org}</div>
          </div>
        ))}
        <button className="ghost" style={{ marginTop: 10 }} onClick={newLead}>
          Simular entrada de lead
        </button>
        <button
          className="ghost"
          style={{ marginTop: 26 }}
          onClick={() => setThemePref((t) => (t === "auto" ? "light" : t === "light" ? "dark" : "auto"))}
        >
          {themePref === "auto" ? `Tema: automático (${theme === "dark" ? "escuro" : "claro"})` : themePref === "light" ? "Tema: claro" : "Tema: escuro"}
        </button>
      </aside>

      <main className="main">
        <div className="crumbs">Páginas / {page.slug}</div>
        <input
          className={"title" + (mode === "error" && !page.title.trim() ? " missing" : "")}
          placeholder="Título da página"
          value={page.title}
          onChange={(e) => updateTitle(e.target.value)}
        />
        <div className="group" style={{ margin: "28px 0 8px" }}>Conteúdo</div>
        <textarea className="body" value={body} onChange={(e) => { setBody(e.target.value); touch(); }} />
        <div className="actions">
          <button className="primary" onClick={publish}>Publicar</button>
          <button className="ghost" onClick={() => send("Sugira um título mais forte para esta página.")}>Sugerir título</button>
        </div>
      </main>

      <div className={"dock" + (open ? " open" : "")} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
        {!open && <Caption text={line} className="beside" />}

        <div className="dockHead">
          <button
            className="orbBtn"
            aria-label={open ? "Recolher o assistente Viglet" : "Abrir o assistente Viglet"}
            aria-expanded={open}
            title={open ? "Recolher" : "Abrir"}
            onClick={() => setOpen((o) => !o)}
          >
            <div className="canvas"><VigletAvatar state={mode} compact={!open} activity={activity} unread={unread} /></div>
          </button>
          {open && (
            <div className="dockMeta">
              <span className="group" style={{ margin: 0 }}>Estado do sistema</span>
              <span className={"stateName " + mode}>{STATE_LABEL[mode]}</span>
              <Caption text={line} className="inline" />
            </div>
          )}
          {open && (
            <button className="collapse" onClick={() => setOpen(false)}>Recolher</button>
          )}
        </div>

        {open && (
          <>
            <div className="chat" ref={listRef}>
              {messages.length === 0 && (
                <div className="chatEmpty">Pergunte sobre esta página ou sobre os leads.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={"msg " + m.role}>
                  <div>{m.text}</div>
                  {m.suggestedTitle && (
                    <button className="link" onClick={() => updateTitle(m.suggestedTitle)}>
                      Usar “{m.suggestedTitle}”
                    </button>
                  )}
                </div>
              ))}
              {busy && <div className="msg assistant thinking">…</div>}
            </div>
            <div className="composer">
              <input
                className="composerInput"
                placeholder="Fale com o Viglet"
                value={draft}
                disabled={busy}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(draft); }}
              />
              <button className="sendBtn" onClick={() => send(draft)} disabled={busy || !draft.trim()}>Enviar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const css = `
  .app { --bg:#14161a; --panel:#181b20; --border:#262a31; --border2:#2c3139; --text:#e6e8ec; --muted:#8b93a1;
    --hover:#20242b; --active:#262a31; --dim:#4a515c; --btn:#e6e8ec; --btnText:#14161a; --btnHover:#fff; --ghostBorder:#3a3f48; }
  .app.light { --bg:#f3f1ec; --panel:#ffffff; --border:#e2ded6; --border2:#d6d1c8; --text:#1e2229; --muted:#6b7280;
    --hover:#f0ede6; --active:#e8e4dc; --dim:#a8a39a; --btn:#1e2229; --btnText:#fff; --btnHover:#2d323b; --ghostBorder:#cfc9bf; }
  .app { display:grid; grid-template-columns:250px minmax(0,1fr); min-height:100vh;
    background:var(--bg); color:var(--text); font-family:'Helvetica Neue','Segoe UI',system-ui,sans-serif; }
  .sidebar { background:var(--panel); border-right:1px solid var(--border); padding:26px 18px; }
  .brand { display:flex; align-items:center; gap:10px; font-size:15px; font-weight:600; margin-bottom:30px; }
  .brandMark { width:14px; height:14px; border-radius:50%;
    background: radial-gradient(circle at 50% 45%, #e3b06a 0%, #d9964a 45%, #a8321a 100%); }
  .group { font-size:12.5px; color:var(--muted); margin-bottom:6px; }
  .muted { font-size:12.5px; color:var(--muted); }
  .main { padding:48px 56px; max-width:760px; }
  .crumbs { color:var(--muted); font-size:13px; margin-bottom:22px; }
  .actions { display:flex; gap:12px; margin-top:28px; }
  .row { display:flex; justify-content:space-between; align-items:center; width:100%;
    background:none; border:0; text-align:left; padding:9px 10px; border-radius:6px;
    font:inherit; font-size:14px; color:var(--text); cursor:pointer; }
  .row:hover { background:var(--hover); }
  .row.active { background:var(--active); }
  .dot { width:6px; height:6px; border-radius:50%; background:var(--ghostBorder); }
  .dot.publicada { background:#d9964a; }
  .lead { padding:8px 10px; font-size:14px; line-height:1.35; border-top:1px solid var(--border); }
  .lead:first-of-type { border-top:0; }
  .title { width:100%; border:0; border-bottom:1px solid var(--border2); background:transparent;
    color:var(--text); font:inherit; font-size:30px; font-weight:500; letter-spacing:-0.4px;
    padding:8px 0; transition:border-color .3s; }
  .title::placeholder { color:var(--dim); }
  .title:focus { outline:none; border-bottom-color:var(--muted); }
  .title.missing { border-bottom-color:#c8441c; }
  .suggestion { display:flex; justify-content:space-between; gap:16px; align-items:baseline;
    margin-top:14px; padding:12px 14px; border:1px solid #2c3139; border-radius:6px;
    font-size:14px; color:#c9cfd8; background:#181b20; }
  .body { width:100%; min-height:170px; border:1px solid var(--border2); border-radius:6px;
    padding:14px; font:inherit; font-size:15px; line-height:1.6; background:var(--panel);
    color:var(--text); resize:vertical; box-sizing:border-box; }
  .body:focus { outline:none; border-color:var(--muted); }
  .primary { background:var(--btn); color:var(--btnText); border:0; padding:10px 22px; border-radius:6px;
    font:inherit; font-size:14.5px; font-weight:600; cursor:pointer; }
  .primary:hover { background:var(--btnHover); }
  .ghost { background:transparent; color:var(--text); border:1px solid var(--ghostBorder); padding:9px 18px;
    border-radius:6px; font:inherit; font-size:14px; cursor:pointer; }
  .ghost:hover { border-color:var(--muted); }
  .link { background:none; border:0; padding:0; color:#d9964a; font:inherit; font-size:14px;
    font-weight:600; cursor:pointer; white-space:nowrap; }
  .row:focus-visible, .primary:focus-visible, .ghost:focus-visible, .link:focus-visible,
  .title:focus-visible, .body:focus-visible { outline:2px solid #d9964a; outline-offset:2px; }
  .stateName { font-size:13px; font-weight:600; transition:color .4s; }
  .stateName.idle { color:#d9964a; }
  .stateName.working { color:#e0a558; }
  .stateName.success { color:#f1cf98; }
  .stateName.error { color:#c8441c; }
  .stateName.attention { color:#e3b06a; }
  .dock { --text:#e6e8ec; --muted:#8b93a1; --ghostBorder:#3a3f48; --panel:#181b20; --border2:#2c3139; --hover:#20242b;
    position:fixed; right:12px; bottom:12px; z-index:20; display:flex; flex-direction:column;
    width:132px; height:132px; border-radius:66px; background:transparent; border:1px solid transparent;
    overflow:visible; box-sizing:border-box;
    transition: width .32s cubic-bezier(.2,.8,.2,1), height .32s cubic-bezier(.2,.8,.2,1), border-radius .32s,
      background-color .32s, border-color .32s, box-shadow .32s; }
  .dock.open { width:360px; height:min(600px, calc(100vh - 40px)); border-radius:16px; padding:14px 16px 14px;
    background:#111316; border-color:#262a31; box-shadow:0 12px 40px rgba(0,0,0,.45); overflow:hidden; right:20px; bottom:20px; }
  .dockHead { display:flex; align-items:center; gap:12px; flex:none; }
  .orbBtn { background:none; border:0; padding:0; cursor:pointer; border-radius:50%; flex:none; }
  .orbBtn:focus-visible { outline:2px solid #d9964a; outline-offset:2px; }
  .canvas { width:130px; height:130px; transition: width .32s, height .32s; }
  .dock.open .canvas { width:104px; height:104px; }
  .dockMeta { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .collapse { align-self:flex-start; background:transparent; border:1px solid #3a3f48; color:#c9cfd8; font:inherit;
    font-size:12.5px; cursor:pointer; padding:5px 10px; border-radius:6px; white-space:nowrap; }
  .collapse:hover { color:#e6e8ec; border-color:#8b93a1; }
  .collapse:focus-visible { outline:2px solid #d9964a; outline-offset:2px; }
  .caption { position:relative; font-family:'Arial Black','Helvetica Neue',Arial,sans-serif; font-weight:900;
    font-size:16px; line-height:1.35; color:#ffd83a; letter-spacing:.4px; padding:2px 4px;
    /* fósforo mais contido: franja de cor bem fina, brilho curto, contorno preto firme */
    text-shadow: -.5px 0 rgba(255,60,60,.2), .5px 0 rgba(60,220,255,.18),
                 0 0 3px rgba(255,216,58,.3),
                 -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 3px #000;
    /* linhas de varredura só dentro das letras (máscara no que é pintado), nunca no fundo */
    -webkit-mask-image: repeating-linear-gradient(to bottom, #000 0 3px, rgba(0,0,0,.85) 3px 4px);
    mask-image: repeating-linear-gradient(to bottom, #000 0 3px, rgba(0,0,0,.85) 3px 4px);
    animation: rise .2s ease-out, flicker 6s infinite; }
  .light .caption { text-shadow: -.5px 0 rgba(255,60,60,.2), .5px 0 rgba(60,220,255,.18),
    -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 3px rgba(0,0,0,.7); }
  .caption.beside { position:absolute; right:126px; bottom:44px; width:max-content;
    max-width:min(380px, calc(100vw - 140px)); text-align:right; }
  .caption.inline { font-size:13px; min-height:18px; }
  @keyframes flicker {
    0%, 100% { opacity:1 } 61% { opacity:1 } 62% { opacity:.96 } 63% { opacity:1 } }
  .caret { display:inline-block; width:1px; height:.95em; margin-left:2px; vertical-align:-.15em;
    background:#f5d020; animation: blink 1s steps(2, start) infinite; }
  @keyframes rise { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }
  @keyframes blink { to { visibility:hidden } }
  @media (prefers-reduced-motion: reduce) { .dock, .canvas { transition:none } .caption, .caret { animation:none } }
  .chat { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding:10px 2px 6px; }
  .chatEmpty { margin:auto; font-size:13px; color:#5b6370; text-align:center; max-width:200px; line-height:1.45; }
  .msg { font-size:13.5px; line-height:1.45; max-width:92%; padding:9px 12px; border-radius:10px; }
  .msg.user { align-self:flex-end; background:#262a31; color:#e6e8ec; border-bottom-right-radius:3px; }
  .msg.assistant { align-self:flex-start; background:transparent; border:1px solid #2c3139; color:#d5dae2; border-bottom-left-radius:3px; }
  .msg.thinking { color:#8b93a1; letter-spacing:2px; }
  .msg .link { display:block; margin-top:8px; text-align:left; white-space:normal; }
  .composer { display:flex; gap:8px; margin-top:8px; flex:none; }
  .composerInput { flex:1; min-width:0; background:#181b20; border:1px solid #2c3139; border-radius:8px; padding:10px 12px;
    color:#e6e8ec; font:inherit; font-size:14px; }
  .composerInput:focus { outline:none; border-color:#8b93a1; }
  .composerInput:disabled { opacity:.6; }
  .sendBtn { background:transparent; color:#e6e8ec; border:1px solid #3a3f48; border-radius:8px; padding:0 14px;
    font:inherit; font-size:13.5px; cursor:pointer; }
  .sendBtn:disabled { opacity:.4; cursor:default; }
  .sendBtn:not(:disabled):hover, .composerInput:focus-visible, .sendBtn:focus-visible { border-color:#d9964a; }
  @media (max-width:900px) { .app { grid-template-columns:1fr; } .dock.open { width:calc(100vw - 24px); right:12px; bottom:12px; } }
`;
