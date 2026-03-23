const brainRegions = [
  {
    id: "language",
    label: "Language Cortex",
    color: "#5fc0b5",
    glow: "rgba(95, 192, 181, 0.32)",
    baseRadius: 31,
    position: { x: 154, y: 128 },
    secondary: false,
    wisps: [
      { x1: -18, y1: -10, cx: -54, cy: -44, x2: -72, y2: -74 },
      { x1: 16, y1: -12, cx: 42, cy: -44, x2: 52, y2: -78 },
      { x1: -10, y1: 18, cx: -44, cy: 42, x2: -70, y2: 52 }
    ]
  },
  {
    id: "prefrontal",
    label: "Prefrontal Cortex",
    color: "#b18df0",
    glow: "rgba(177, 141, 240, 0.3)",
    baseRadius: 36,
    position: { x: 802, y: 118 },
    secondary: false,
    wisps: [
      { x1: -20, y1: -14, cx: -54, cy: -42, x2: -78, y2: -68 },
      { x1: 16, y1: -8, cx: 54, cy: -40, x2: 80, y2: -60 },
      { x1: 18, y1: 16, cx: 54, cy: 34, x2: 74, y2: 58 }
    ]
  },
  {
    id: "hippocampus",
    label: "Hippocampus",
    color: "#7db5ff",
    glow: "rgba(125, 181, 255, 0.28)",
    baseRadius: 34,
    position: { x: 452, y: 350 },
    secondary: false,
    wisps: [
      { x1: -20, y1: -16, cx: -54, cy: -42, x2: -78, y2: -64 },
      { x1: 18, y1: -12, cx: 42, cy: -34, x2: 60, y2: -62 },
      { x1: 12, y1: 20, cx: 36, cy: 52, x2: 58, y2: 76 }
    ]
  },
  {
    id: "amygdala",
    label: "Amygdala",
    color: "#f0aa56",
    glow: "rgba(240, 170, 86, 0.28)",
    baseRadius: 30,
    position: { x: 216, y: 466 },
    secondary: false,
    wisps: [
      { x1: -16, y1: -12, cx: -42, cy: -30, x2: -58, y2: -52 },
      { x1: 14, y1: -8, cx: 38, cy: -28, x2: 60, y2: -44 },
      { x1: -10, y1: 16, cx: -32, cy: 42, x2: -46, y2: 66 }
    ]
  },
  {
    id: "thalamus",
    label: "Thalamus",
    color: "#93b1ff",
    glow: "rgba(147, 177, 255, 0.22)",
    baseRadius: 18,
    position: { x: 332, y: 256 },
    secondary: true,
    wisps: [
      { x1: -10, y1: -6, cx: -24, cy: -18, x2: -36, y2: -30 },
      { x1: 10, y1: 6, cx: 20, cy: 18, x2: 32, y2: 26 }
    ]
  },
  {
    id: "basal-ganglia",
    label: "Basal Ganglia",
    color: "#d2a1ff",
    glow: "rgba(210, 161, 255, 0.2)",
    baseRadius: 16,
    position: { x: 662, y: 286 },
    secondary: true,
    wisps: [
      { x1: -8, y1: -8, cx: -24, cy: -20, x2: -34, y2: -34 },
      { x1: 8, y1: 8, cx: 22, cy: 20, x2: 34, y2: 30 }
    ]
  },
  {
    id: "cerebellum",
    label: "Cerebellum",
    color: "#74c7a3",
    glow: "rgba(116, 199, 163, 0.2)",
    baseRadius: 17,
    position: { x: 786, y: 488 },
    secondary: true,
    wisps: [
      { x1: -8, y1: -6, cx: -22, cy: -18, x2: -34, y2: -28 },
      { x1: 8, y1: -4, cx: 20, cy: -18, x2: 30, y2: -28 }
    ]
  }
];

const connections = [
  { id: "amygdala-hippocampus", from: "amygdala", to: "hippocampus", weight: 0.92 },
  { id: "hippocampus-prefrontal", from: "hippocampus", to: "prefrontal", weight: 0.84 },
  { id: "amygdala-thalamus", from: "amygdala", to: "thalamus", weight: 0.72 },
  { id: "thalamus-language", from: "thalamus", to: "language", weight: 0.7 },
  { id: "thalamus-hippocampus", from: "thalamus", to: "hippocampus", weight: 0.74 },
  { id: "prefrontal-language", from: "prefrontal", to: "language", weight: 0.8 },
  { id: "hippocampus-basal-ganglia", from: "hippocampus", to: "basal-ganglia", weight: 0.66 },
  { id: "prefrontal-basal-ganglia", from: "prefrontal", to: "basal-ganglia", weight: 0.7 },
  { id: "language-cerebellum", from: "language", to: "cerebellum", weight: 0.58 },
  { id: "basal-ganglia-cerebellum", from: "basal-ganglia", to: "cerebellum", weight: 0.54 }
];

const literatureActivation = {
  fear: { activation: { amygdala: 0.96, hippocampus: 0.58, prefrontal: 0.44, language: 0.21, thalamus: 0.52, "basal-ganglia": 0.32, cerebellum: 0.26 }, dominant: "Amygdala", strength: 0.87 },
  memory: { activation: { amygdala: 0.32, hippocampus: 0.94, prefrontal: 0.62, language: 0.38, thalamus: 0.46, "basal-ganglia": 0.28, cerebellum: 0.22 }, dominant: "Hippocampus", strength: 0.81 },
  learning: { activation: { amygdala: 0.28, hippocampus: 0.88, prefrontal: 0.83, language: 0.56, thalamus: 0.49, "basal-ganglia": 0.58, cerebellum: 0.34 }, dominant: "Hippocampus", strength: 0.84 },
  focus: { activation: { amygdala: 0.18, hippocampus: 0.46, prefrontal: 0.95, language: 0.52, thalamus: 0.36, "basal-ganglia": 0.54, cerebellum: 0.24 }, dominant: "Prefrontal Cortex", strength: 0.89 },
  stress: { activation: { amygdala: 0.91, hippocampus: 0.42, prefrontal: 0.39, language: 0.18, thalamus: 0.57, "basal-ganglia": 0.33, cerebellum: 0.25 }, dominant: "Amygdala", strength: 0.85 },
  joy: { activation: { amygdala: 0.54, hippocampus: 0.62, prefrontal: 0.82, language: 0.47, thalamus: 0.34, "basal-ganglia": 0.41, cerebellum: 0.44 }, dominant: "Prefrontal Cortex", strength: 0.73 }
};

const keywordAliases = {
  anxious: "stress",
  anxiety: "stress",
  happy: "joy",
  recall: "memory",
  concentration: "focus",
  study: "learning",
  danger: "fear"
};

const adjacency = connections.reduce((map, connection) => {
  map[connection.from] ??= [];
  map[connection.to] ??= [];
  map[connection.from].push({ neighbor: connection.to, connectionId: connection.id });
  map[connection.to].push({ neighbor: connection.from, connectionId: connection.id });
  return map;
}, {});

const state = {
  currentWord: "resting",
  mode: "fallback dataset",
  activation: Object.fromEntries(brainRegions.map((region) => [region.id, 0])),
  dominant: "resting",
  dominantId: null,
  strength: 0,
  pulses: [],
  nodePulses: [],
  activeNodes: new Map(),
  activeConnections: new Map(),
  nodeRefs: new Map(),
  connectionRefs: new Map()
};

const svg = document.querySelector("#networkSvg");
const chart = document.querySelector("#activationChart");
const chartContext = chart.getContext("2d");
const currentWordEl = document.querySelector("#currentWord");
const dominantRegionEl = document.querySelector("#dominantRegion");
const connectionStrengthEl = document.querySelector("#connectionStrength");
const dataModeEl = document.querySelector("#dataMode");
const wordForm = document.querySelector("#wordForm");
const wordInput = document.querySelector("#wordInput");

function makeSvg(tag, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function formatWord(value) {
  return value.replace(/(^\w)|(\s+\w)/g, (match) => match.toUpperCase());
}

function getRegionById(id) {
  return brainRegions.find((region) => region.id === id);
}

function resolveCueWord(rawWord) {
  const normalized = rawWord.trim().toLowerCase();
  if (!normalized) return "resting";
  if (literatureActivation[normalized]) return normalized;
  if (keywordAliases[normalized]) return keywordAliases[normalized];
  return null;
}

function approximateActivation(word) {
  const chars = [...word];
  const seed = chars.reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  const values = Object.fromEntries(brainRegions.map((region, index) => {
    const mod = 32 + index * 5;
    const offset = region.secondary ? 12 : 20;
    return [region.id, clamp((((seed >> index) % mod) + offset) / 100)];
  }));
  const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
  return {
    activation: values,
    dominant: formatWord(getRegionById(sorted[0][0]).label.toLowerCase()),
    strength: clamp(sorted[0][1] * 0.84)
  };
}

function renderAxisHud() {
  const axis = document.querySelector(".axis-indicator");
  axis.innerHTML = `
    <div class="axis-line axis-x"><span>X</span></div>
    <div class="axis-line axis-y"><span>Y</span></div>
    <div class="axis-line axis-z"><span>Z</span></div>
  `;
}

function renderNetwork() {
  svg.innerHTML = "";
  const defs = makeSvg("defs");

  brainRegions.forEach((region) => {
    const radial = makeSvg("radialGradient", { id: `grad-${region.id}`, cx: "34%", cy: "32%" });
    radial.appendChild(makeSvg("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.82" }));
    radial.appendChild(makeSvg("stop", { offset: "18%", "stop-color": region.color, "stop-opacity": "0.92" }));
    radial.appendChild(makeSvg("stop", { offset: "58%", "stop-color": region.color, "stop-opacity": "0.46" }));
    radial.appendChild(makeSvg("stop", { offset: "100%", "stop-color": region.color, "stop-opacity": "0" }));
    defs.appendChild(radial);
  });

  svg.appendChild(defs);
  svg.appendChild(makeSvg("rect", {
    x: 0,
    y: 0,
    width: 980,
    height: 660,
    fill: "#0a0e1a"
  }));

  const connectionLayer = makeSvg("g");
  const streakLayer = makeSvg("g", { id: "streakLayer" });
  const nodeLayer = makeSvg("g");

  connections.forEach((connection) => {
    const from = getRegionById(connection.from).position;
    const to = getRegionById(connection.to).position;
    const base = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: "#1e2d45",
      "stroke-width": 0.5,
      "stroke-linecap": "round"
    });
    const glow = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: "#fff5c0",
      "stroke-width": 2,
      "stroke-linecap": "round",
      opacity: "0"
    });
    const trail = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: "rgba(255,245,192,0.36)",
      "stroke-width": 1.2,
      "stroke-linecap": "round",
      opacity: "0"
    });
    connectionLayer.append(base, trail, glow);
    state.connectionRefs.set(connection.id, { base, trail, glow, connection });
  });

  brainRegions.forEach((region) => {
    const group = makeSvg("g", { transform: `translate(${region.position.x} ${region.position.y})` });
    const wispLayer = makeSvg("g");
    const pulseLayer = makeSvg("g");

    region.wisps.forEach((wisp) => {
      wispLayer.appendChild(makeSvg("path", {
        d: `M ${wisp.x1} ${wisp.y1} Q ${wisp.cx} ${wisp.cy} ${wisp.x2} ${wisp.y2}`,
        stroke: "rgba(127, 148, 180, 0.16)",
        "stroke-width": 0.5,
        fill: "none",
        "stroke-linecap": "round"
      }));
    });

    const glow = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius + 12,
      fill: region.glow,
      opacity: "0.22"
    });
    const sphere = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius,
      fill: `url(#grad-${region.id})`,
      opacity: region.secondary ? "0.52" : "0.62"
    });
    const label = makeSvg("text", {
      x: 0,
      y: region.baseRadius + 24,
      "text-anchor": "middle",
      "font-size": region.secondary ? "12" : "13",
      "font-family": "DM Sans, sans-serif",
      fill: "#eef3ff",
      opacity: region.secondary ? "0.72" : "0.9"
    });
    label.textContent = region.label;

    group.append(wispLayer, glow, sphere, pulseLayer, label);
    nodeLayer.appendChild(group);
    state.nodeRefs.set(region.id, { wispLayer, glow, sphere, pulseLayer, label, region });
  });

  svg.append(connectionLayer, streakLayer, nodeLayer);
}

function drawRoundedRect(context, x, y, width, height, radius) {
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function drawChart() {
  const width = chart.width;
  const height = chart.height;
  chartContext.clearRect(0, 0, width, height);

  const entries = brainRegions.filter((region) => !region.secondary).map((region) => ({
    ...region,
    value: state.activation[region.id] || 0
  }));
  const barWidth = 24;
  const gap = 36;
  const startX = 42;
  const maxBarHeight = 132;
  const baseY = height - 36;

  entries.forEach((entry, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = Math.max(entry.value * maxBarHeight, 8);

    chartContext.fillStyle = "rgba(255,255,255,0.06)";
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - maxBarHeight, barWidth, maxBarHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = entry.color;
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - barHeight, barWidth, barHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = "#8591aa";
    chartContext.font = "11px DM Sans";
    chartContext.textAlign = "center";
    chartContext.fillText(entry.label.split(" ")[0], x + barWidth / 2, height - 12);
  });
}

function updateReadouts() {
  currentWordEl.textContent = state.currentWord;
  dominantRegionEl.textContent = state.dominant;
  connectionStrengthEl.textContent = state.strength.toFixed(2);
  dataModeEl.textContent = state.mode;
  drawChart();
}

function buildCascade(startId) {
  const visitedNodes = new Set([startId]);
  const visitedConnections = new Set();
  const queue = [{ nodeId: startId, depth: 0 }];
  const nodeEvents = [{ nodeId: startId, depth: 0 }];
  const connectionEvents = [];

  while (queue.length) {
    const current = queue.shift();
    const edges = adjacency[current.nodeId] || [];
    const toFire = edges.filter(({ connectionId }) => !visitedConnections.has(connectionId));

    toFire.forEach(({ neighbor, connectionId }) => {
      visitedConnections.add(connectionId);
      connectionEvents.push({ connectionId, from: current.nodeId, to: neighbor, depth: current.depth });
    });

    edges.forEach(({ neighbor }) => {
      if (!visitedNodes.has(neighbor)) {
        visitedNodes.add(neighbor);
        queue.push({ nodeId: neighbor, depth: current.depth + 1 });
        nodeEvents.push({ nodeId: neighbor, depth: current.depth + 1 });
      }
    });
  }

  return { nodeEvents, connectionEvents };
}

function triggerCascade(startId) {
  state.pulses = [];
  state.nodePulses = [];
  state.activeNodes.clear();
  state.activeConnections.clear();
  if (!startId) return;

  const now = performance.now();
  const { nodeEvents, connectionEvents } = buildCascade(startId);

  nodeEvents.forEach((event) => {
    const region = getRegionById(event.nodeId);
    const start = now + event.depth * 620;
    state.nodePulses.push({ nodeId: event.nodeId, start, duration: 800 });
    state.activeNodes.set(event.nodeId, { start, duration: 2200, color: region.color });
  });

  connectionEvents.forEach((event) => {
    const start = now + event.depth * 620 + 120;
    const source = getRegionById(event.from);
    state.pulses.push({
      connectionId: event.connectionId,
      from: event.from,
      to: event.to,
      color: source.color,
      start,
      duration: 720,
      fade: 1800
    });
    state.activeConnections.set(event.connectionId, { start: start + 720, duration: 1800, color: source.color });
  });
}

function applyScenario(word) {
  const resolved = resolveCueWord(word);
  const scenario =
    resolved && literatureActivation[resolved]
      ? literatureActivation[resolved]
      : word && word !== "resting"
        ? approximateActivation(word)
        : {
            activation: Object.fromEntries(brainRegions.map((region) => [region.id, 0])),
            dominant: "resting",
            strength: 0
          };

  state.currentWord = word || "resting";
  state.activation = scenario.activation;
  state.dominant = scenario.dominant;
  state.dominantId = Object.entries(scenario.activation).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  state.strength = scenario.strength;
  triggerCascade(state.dominantId);
  updateReadouts();
}

function animate(now) {
  const streakLayer = document.querySelector("#streakLayer");
  streakLayer.innerHTML = "";
  let activeVisuals = 0;

  state.connectionRefs.forEach(({ base, trail, glow, connection }) => {
    const pulse = state.pulses.find((item) => item.connectionId === connection.id);
    const activeState = state.activeConnections.get(connection.id);
    let sustained = 0;
    let glowOpacity = 0;

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
        activeVisuals += 1;
        sustained = 1 - elapsed / activeState.duration;
      }
    }

    if (pulse) {
      const elapsed = now - pulse.start;
      const total = pulse.duration + pulse.fade;
      if (elapsed >= 0 && elapsed <= total) {
        activeVisuals += 1;
        if (elapsed <= pulse.duration) {
          const progress = elapsed / pulse.duration;
          const from = getRegionById(pulse.from).position;
          const to = getRegionById(pulse.to).position;
          const head = progress;
          const tail = Math.max(0, progress - 0.18);
          const headX = from.x + (to.x - from.x) * head;
          const headY = from.y + (to.y - from.y) * head;
          const tailX = from.x + (to.x - from.x) * tail;
          const tailY = from.y + (to.y - from.y) * tail;

          streakLayer.appendChild(makeSvg("line", {
            x1: tailX,
            y1: tailY,
            x2: headX,
            y2: headY,
            stroke: pulse.color,
            "stroke-width": 6.4,
            "stroke-linecap": "round",
            opacity: "0.18"
          }));
          streakLayer.appendChild(makeSvg("line", {
            x1: tailX,
            y1: tailY,
            x2: headX,
            y2: headY,
            stroke: "#fff5c0",
            "stroke-width": 2.6,
            "stroke-linecap": "round",
            opacity: "0.98"
          }));
          glowOpacity = 1;
        } else {
          glowOpacity = Math.max(0, 1 - (elapsed - pulse.duration) / pulse.fade);
        }
      }
    }

    trail.setAttribute("opacity", String(Math.max(sustained * 0.42, glowOpacity * 0.28)));
    trail.setAttribute("stroke-width", String(1 + Math.max(sustained, glowOpacity) * 0.8));
    glow.setAttribute("opacity", String(Math.max(sustained * 0.26, glowOpacity * 0.34)));
    glow.setAttribute("stroke-width", String(1.4 + Math.max(sustained, glowOpacity) * 1.1));
    base.setAttribute("stroke", sustained > 0 ? "#314867" : "#1e2d45");
  });

  state.nodeRefs.forEach(({ wispLayer, glow, sphere, pulseLayer, label, region }) => {
    pulseLayer.innerHTML = "";
    const activation = state.activation[region.id] || 0;
    const activeState = state.activeNodes.get(region.id);
    let pulseStrength = 0;

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
        activeVisuals += 1;
        pulseStrength = 1 - elapsed / activeState.duration;
      }
    }

    const isDominant = state.dominantId === region.id;
    const baseScale = region.secondary ? 0.96 : 1;
    const scale = baseScale + (isDominant ? 0.08 : 0) + pulseStrength * 0.08;
    glow.setAttribute("opacity", String(0.18 + activation * 0.14 + pulseStrength * 0.32));
    sphere.setAttribute("opacity", String((region.secondary ? 0.42 : 0.5) + activation * 0.18 + pulseStrength * 0.3));
    sphere.setAttribute("transform", `scale(${scale})`);
    glow.setAttribute("transform", `scale(${1 + pulseStrength * 0.18})`);
    label.setAttribute("opacity", String(region.secondary ? 0.74 : 0.9));

    if (pulseStrength > 0) {
      pulseLayer.appendChild(makeSvg("circle", {
        cx: 0,
        cy: 0,
        r: region.baseRadius + pulseStrength * 22,
        fill: "none",
        stroke: region.color,
        "stroke-width": 1.4,
        opacity: String(pulseStrength * 0.5)
      }));
    }

    Array.from(wispLayer.children).forEach((wisp) => {
      wisp.setAttribute("stroke", pulseStrength > 0.02 ? region.color : "rgba(127, 148, 180, 0.16)");
      wisp.setAttribute("opacity", String(0.18 + pulseStrength * 0.6));
    });
  });

  requestAnimationFrame(animate);
}

async function queryAllenBrainAtlas() {
  const structureCriteria = [
    "Amygdala",
    "Hippocampus",
    "Prefrontal cortex",
    "Temporal association areas"
  ].map((name) => `[name$il'${name}']`).join(",");

  const criteria = `or${structureCriteria}`;
  const url = `https://api.brain-map.org/api/v2/data/Structure/query.json?criteria=${encodeURIComponent(criteria)}&num_rows=8`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Allen API responded ${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload.msg) ? payload.msg : [];
    const usable = rows.some((row) => row?.name && row?.graph_id);
    if (!usable) throw new Error("Allen API returned structure metadata without usable activation values");

    state.mode = "allen metadata + literature fallback";
  } catch (error) {
    state.mode = "fallback dataset";
  }
  updateReadouts();
}

function bindEvents() {
  wordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyScenario(wordInput.value.trim().toLowerCase());
  });
}

renderAxisHud();
renderNetwork();
bindEvents();
updateReadouts();
applyScenario("fear");
queryAllenBrainAtlas();
requestAnimationFrame(animate);
