const brainRegions = [
  {
    id: "amygdala",
    label: "Amygdala",
    color: "#d88a44",
    baseRadius: 34,
    position: { x: 190, y: 470 },
    branches: [
      { x1: -36, y1: -10, x2: -86, y2: -42 },
      { x1: -20, y1: 28, x2: -62, y2: 74 },
      { x1: 22, y1: -24, x2: 58, y2: -74 },
      { x1: 38, y1: 12, x2: 88, y2: 34 }
    ]
  },
  {
    id: "hippocampus",
    label: "Hippocampus",
    color: "#5684b8",
    baseRadius: 31,
    position: { x: 430, y: 240 },
    branches: [
      { x1: -28, y1: -24, x2: -72, y2: -72 },
      { x1: -26, y1: 18, x2: -74, y2: 52 },
      { x1: 18, y1: -20, x2: 50, y2: -68 },
      { x1: 28, y1: 22, x2: 74, y2: 68 }
    ]
  },
  {
    id: "prefrontal",
    label: "Prefrontal Cortex",
    color: "#8663a9",
    baseRadius: 37,
    position: { x: 760, y: 170 },
    branches: [
      { x1: -34, y1: -14, x2: -82, y2: -56 },
      { x1: -16, y1: 32, x2: -42, y2: 90 },
      { x1: 20, y1: -30, x2: 48, y2: -88 },
      { x1: 42, y1: 16, x2: 92, y2: 38 }
    ]
  },
  {
    id: "language",
    label: "Language Cortex",
    color: "#4f9e9a",
    baseRadius: 33,
    position: { x: 900, y: 500 },
    branches: [
      { x1: -34, y1: -18, x2: -78, y2: -56 },
      { x1: -20, y1: 28, x2: -56, y2: 82 },
      { x1: 18, y1: -24, x2: 50, y2: -72 },
      { x1: 34, y1: 18, x2: 78, y2: 42 }
    ]
  }
];

const connections = [
  { id: "amygdala-hippocampus", from: "amygdala", to: "hippocampus", weight: 0.92 },
  { id: "hippocampus-prefrontal", from: "hippocampus", to: "prefrontal", weight: 0.84 },
  { id: "amygdala-prefrontal", from: "amygdala", to: "prefrontal", weight: 0.76 },
  { id: "prefrontal-language", from: "prefrontal", to: "language", weight: 0.8 },
  { id: "hippocampus-language", from: "hippocampus", to: "language", weight: 0.68 }
];

const literatureActivation = {
  fear: {
    activation: { amygdala: 0.96, hippocampus: 0.58, prefrontal: 0.44, language: 0.21 },
    dominant: "Amygdala",
    strength: 0.87
  },
  memory: {
    activation: { amygdala: 0.32, hippocampus: 0.94, prefrontal: 0.62, language: 0.38 },
    dominant: "Hippocampus",
    strength: 0.81
  },
  learning: {
    activation: { amygdala: 0.28, hippocampus: 0.88, prefrontal: 0.83, language: 0.56 },
    dominant: "Hippocampus",
    strength: 0.84
  },
  focus: {
    activation: { amygdala: 0.18, hippocampus: 0.46, prefrontal: 0.95, language: 0.52 },
    dominant: "Prefrontal Cortex",
    strength: 0.89
  },
  stress: {
    activation: { amygdala: 0.91, hippocampus: 0.42, prefrontal: 0.39, language: 0.18 },
    dominant: "Amygdala",
    strength: 0.85
  },
  joy: {
    activation: { amygdala: 0.54, hippocampus: 0.62, prefrontal: 0.82, language: 0.47 },
    dominant: "Prefrontal Cortex",
    strength: 0.73
  }
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
  sourceStatus:
    "Attempting Allen Brain Atlas structure query. Emotional state activation is not directly available there, so the viewer will use literature-derived mappings when the API yields metadata only or the request fails.",
  activation: { amygdala: 0, hippocampus: 0, prefrontal: 0, language: 0 },
  dominant: "resting",
  dominantId: null,
  strength: 0,
  cascadeState: "resting",
  lastActivated: "--:--:--",
  pulses: [],
  nodeRipples: [],
  activeNodes: new Map(),
  activeConnections: new Map(),
  nodeRefs: new Map(),
  connectionRefs: new Map()
};

const svg = document.querySelector("#networkSvg");
const chart = document.querySelector("#activationChart");
const chartContext = chart.getContext("2d");
const currentWordEl = document.querySelector("#currentWord");
const lastActivatedEl = document.querySelector("#lastActivated");
const activeRegionsEl = document.querySelector("#activeRegions");
const dominantRegionEl = document.querySelector("#dominantRegion");
const connectionStrengthEl = document.querySelector("#connectionStrength");
const signalCascadeEl = document.querySelector("#signalCascade");
const dataModeEl = document.querySelector("#dataMode");
const sourceStatusEl = document.querySelector("#sourceStatus");
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

function getConnectionId(from, to) {
  const direct = `${from}-${to}`;
  return state.connectionRefs.has(direct) ? direct : `${to}-${from}`;
}

function resolveCueWord(rawWord) {
  const normalized = rawWord.trim().toLowerCase();
  if (!normalized) {
    return "resting";
  }
  if (literatureActivation[normalized]) {
    return normalized;
  }
  if (keywordAliases[normalized]) {
    return keywordAliases[normalized];
  }
  return null;
}

function approximateActivation(word) {
  const chars = [...word];
  const seed = chars.reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  const values = {
    amygdala: clamp(((seed % 37) + 18) / 100),
    hippocampus: clamp((((seed >> 1) % 44) + 28) / 100),
    prefrontal: clamp((((seed >> 2) % 52) + 22) / 100),
    language: clamp((((seed >> 3) % 40) + 24) / 100)
  };
  const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
  return {
    activation: values,
    dominant: formatWord(getRegionById(sorted[0][0]).label.toLowerCase()),
    strength: clamp(sorted[0][1] * 0.86)
  };
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour12: false });
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
  const connectionLayer = makeSvg("g");
  const pulseLayer = makeSvg("g", { id: "pulseLayer" });
  const nodeLayer = makeSvg("g");

  connections.forEach((connection) => {
    const from = getRegionById(connection.from);
    const to = getRegionById(connection.to);
    const line = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "rgba(84, 91, 99, 0.7)",
      "stroke-width": 0.5,
      "stroke-linecap": "round"
    });
    const glow = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "#00d4aa",
      "stroke-width": 2,
      "stroke-linecap": "round",
      opacity: "0"
    });
    const highlight = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "#ffffff",
      "stroke-width": 1.1,
      "stroke-linecap": "round",
      opacity: "0"
    });
    connectionLayer.append(line, glow, highlight);
    state.connectionRefs.set(connection.id, { line, glow, highlight, connection });
  });

  brainRegions.forEach((region) => {
    const group = makeSvg("g", { transform: `translate(${region.position.x} ${region.position.y})` });
    const rippleLayer = makeSvg("g");

    region.branches.forEach((branch) => {
      group.appendChild(makeSvg("path", {
        d: `M ${branch.x1} ${branch.y1} Q ${(branch.x1 + branch.x2) / 2} ${(branch.y1 + branch.y2) / 2 - 10} ${branch.x2} ${branch.y2}`,
        stroke: "rgba(133, 145, 158, 0.72)",
        "stroke-width": 2.3,
        fill: "none",
        "stroke-linecap": "round"
      }));
      group.appendChild(makeSvg("circle", {
        cx: branch.x2,
        cy: branch.y2,
        r: 2.8,
        fill: "rgba(150, 160, 170, 0.5)"
      }));
    });

    const outerRing = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius + 6,
      fill: "none",
      stroke: "rgba(240,246,252,0.14)",
      "stroke-width": 1.2
    });
    const soma = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius,
      fill: region.color,
      opacity: "0.4",
      stroke: "rgba(255,255,255,0.14)",
      "stroke-width": 1.2
    });
    const core = makeSvg("circle", {
      cx: -region.baseRadius * 0.18,
      cy: -region.baseRadius * 0.18,
      r: region.baseRadius * 0.3,
      fill: "rgba(255,255,255,0.12)",
      opacity: "0.4"
    });
    const activeHalo = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius + 4,
      fill: "none",
      stroke: "#00d4aa",
      "stroke-width": 2.2,
      opacity: "0"
    });
    const label = makeSvg("text", {
      x: 0,
      y: region.baseRadius + 34,
      "text-anchor": "middle",
      "font-size": "14",
      "font-family": "JetBrains Mono, monospace",
      fill: "#f0f6fc",
      opacity: "0.82"
    });
    label.textContent = region.label;

    group.append(rippleLayer, outerRing, soma, core, activeHalo, label);
    nodeLayer.appendChild(group);
    state.nodeRefs.set(region.id, { rippleLayer, outerRing, soma, core, activeHalo, label, region });
  });

  svg.append(connectionLayer, pulseLayer, nodeLayer);
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

  const entries = brainRegions.map((region) => ({
    ...region,
    value: state.activation[region.id] || 0
  }));

  const barWidth = 26;
  const gap = 36;
  const startX = 44;
  const maxBarHeight = 132;
  const baseY = height - 38;

  entries.forEach((entry, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = Math.max(entry.value * maxBarHeight, 8);

    chartContext.fillStyle = "rgba(255,255,255,0.08)";
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - maxBarHeight, barWidth, maxBarHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = entry.color;
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - barHeight, barWidth, barHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = "#9ba6b2";
    chartContext.font = "10px JetBrains Mono";
    chartContext.textAlign = "center";
    chartContext.fillText(entry.label.split(" ")[0], x + barWidth / 2, height - 14);
  });
}

function updateReadouts() {
  currentWordEl.textContent = state.currentWord;
  lastActivatedEl.textContent = state.lastActivated;
  activeRegionsEl.textContent = String(Object.values(state.activation).filter((value) => value >= 0.3).length);
  dominantRegionEl.textContent = state.dominant;
  connectionStrengthEl.textContent = state.strength.toFixed(2);
  signalCascadeEl.textContent = state.cascadeState;
  dataModeEl.textContent = state.mode;
  sourceStatusEl.textContent = state.sourceStatus;
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

    edges.forEach(({ neighbor, connectionId }) => {
      if (!visitedConnections.has(connectionId)) {
        visitedConnections.add(connectionId);
        connectionEvents.push({
          connectionId,
          from: current.nodeId,
          to: neighbor,
          depth: current.depth
        });
      }
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
  state.nodeRipples = [];
  state.activeNodes.clear();
  state.activeConnections.clear();
  state.cascadeState = startId ? "propagating" : "resting";

  if (!startId) {
    return;
  }

  const now = performance.now();
  const { nodeEvents, connectionEvents } = buildCascade(startId);

  nodeEvents.forEach((event) => {
    state.nodeRipples.push({
      nodeId: event.nodeId,
      start: now + event.depth * 220,
      duration: 1100
    });
    state.activeNodes.set(event.nodeId, {
      start: now + event.depth * 220,
      duration: 2200
    });
  });

  connectionEvents.forEach((event, index) => {
    const stagger = event.depth * 220 + (index % 2) * 90 + 40;
    state.pulses.push({
      connectionId: event.connectionId,
      from: event.from,
      to: event.to,
      start: now + stagger,
      duration: 240,
      afterglow: 1000
    });
    state.activeConnections.set(event.connectionId, {
      start: now + stagger,
      duration: 1800
    });
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
            activation: { amygdala: 0, hippocampus: 0, prefrontal: 0, language: 0 },
            dominant: "resting",
            strength: 0
          };

  state.currentWord = word || "resting";
  state.activation = scenario.activation;
  state.dominant = scenario.dominant;
  state.dominantId = Object.entries(scenario.activation).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  state.strength = scenario.strength;
  state.lastActivated = formatTimestamp();
  triggerCascade(state.dominantId);
  updateReadouts();
}

function renderRipples(now) {
  state.nodeRefs.forEach(({ rippleLayer }) => {
    rippleLayer.innerHTML = "";
  });

  state.nodeRipples = state.nodeRipples.filter((ripple) => now - ripple.start <= ripple.duration);

  state.nodeRipples.forEach((ripple) => {
    const ref = state.nodeRefs.get(ripple.nodeId);
    if (!ref) {
      return;
    }
    const elapsed = now - ripple.start;
    if (elapsed < 0) {
      return;
    }
    const progress = elapsed / ripple.duration;
    for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
      const shifted = progress - ringIndex * 0.16;
      if (shifted < 0 || shifted > 1) {
        continue;
      }
      const radius = ref.region.baseRadius + 6 + shifted * 26;
      const opacity = (1 - shifted) * 0.34;
      ref.rippleLayer.appendChild(makeSvg("circle", {
        cx: 0,
        cy: 0,
        r: radius,
        fill: "none",
        stroke: "#00d4aa",
        "stroke-width": 1.4,
        opacity: opacity.toFixed(3)
      }));
    }
  });
}

function animate() {
  const pulseLayer = document.querySelector("#pulseLayer");
  pulseLayer.innerHTML = "";
  const now = performance.now();
  let activeVisuals = 0;

  renderRipples(now);

  state.connectionRefs.forEach(({ line, glow, highlight, connection }) => {
    const pulse = state.pulses.find((item) => item.connectionId === connection.id);
    const activeState = state.activeConnections.get(connection.id);
    let sustained = 0;
    let glowStrength = 0;

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
        sustained = 0.18 + (1 - elapsed / activeState.duration) * 0.28;
      }
    }

    if (pulse) {
      const elapsed = now - pulse.start;
      const total = pulse.duration + pulse.afterglow;
      if (elapsed >= 0 && elapsed <= total) {
        activeVisuals += 1;
        if (elapsed <= pulse.duration) {
          const progress = elapsed / pulse.duration;
          const from = getRegionById(pulse.from).position;
          const to = getRegionById(pulse.to).position;
          const headProgress = progress;
          const tailProgress = Math.max(0, progress - 0.14);
          const headX = from.x + (to.x - from.x) * headProgress;
          const headY = from.y + (to.y - from.y) * headProgress;
          const tailX = from.x + (to.x - from.x) * tailProgress;
          const tailY = from.y + (to.y - from.y) * tailProgress;

          pulseLayer.appendChild(makeSvg("line", {
            x1: tailX,
            y1: tailY,
            x2: headX,
            y2: headY,
            stroke: "#00d4aa",
            "stroke-width": 7.5,
            "stroke-linecap": "round",
            opacity: "0.24"
          }));
          pulseLayer.appendChild(makeSvg("line", {
            x1: tailX,
            y1: tailY,
            x2: headX,
            y2: headY,
            stroke: "#ffffff",
            "stroke-width": 2.4,
            "stroke-linecap": "round",
            opacity: "0.98"
          }));
          glowStrength = 1;
        } else {
          glowStrength = 1 - (elapsed - pulse.duration) / pulse.afterglow;
        }
      }
    }

    const lineStrength = Math.max(sustained, glowStrength * 0.9);
    line.setAttribute("stroke", lineStrength > 0 ? "rgba(124, 145, 156, 0.95)" : "rgba(84, 91, 99, 0.7)");
    line.setAttribute("stroke-width", lineStrength > 0 ? String(0.7 + lineStrength * 0.7) : "0.5");
    glow.setAttribute("opacity", String(Math.max(sustained * 0.8, glowStrength * 0.5)));
    highlight.setAttribute("opacity", String(glowStrength));
  });

  state.nodeRefs.forEach(({ soma, core, activeHalo, label, region }) => {
    const activation = state.activation[region.id] || 0;
    const active = state.activeNodes.get(region.id);
    let activeStrength = 0;

    if (active) {
      const elapsed = now - active.start;
      if (elapsed >= 0 && elapsed <= active.duration) {
        activeVisuals += 1;
        activeStrength = 1 - elapsed / active.duration;
      }
    }

    const dominantBoost = state.dominantId === region.id ? 0.24 : 0;
    soma.setAttribute("opacity", String(clamp(0.4 + activation * 0.36 + activeStrength * 0.28 + dominantBoost, 0.4, 1)));
    soma.setAttribute("r", String(region.baseRadius + activeStrength * 1.6));
    core.setAttribute("opacity", String(0.18 + activeStrength * 0.35));
    activeHalo.setAttribute("opacity", String(activeStrength * 0.85));
    activeHalo.setAttribute("r", String(region.baseRadius + 5 + activeStrength * 6));
    label.setAttribute("opacity", String(state.dominantId === region.id ? 1 : 0.72));
  });

  if (activeVisuals > 0) {
    state.cascadeState = "propagating";
    signalCascadeEl.textContent = "propagating";
  } else if (state.cascadeState !== "resting") {
    state.cascadeState = "resting";
    signalCascadeEl.textContent = "resting";
  }

  requestAnimationFrame(animate);
}

async function queryAllenBrainAtlas() {
  const structureCriteria = [
    "Amygdala",
    "Hippocampus",
    "Prefrontal cortex",
    "Temporal association areas"
  ]
    .map((name) => `[name$il'${name}']`)
    .join(",");

  const criteria = `or${structureCriteria}`;
  const url = `https://api.brain-map.org/api/v2/data/Structure/query.json?criteria=${encodeURIComponent(criteria)}&num_rows=8`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Allen API responded ${response.status}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload.msg) ? payload.msg : [];
    const usable = rows.some((row) => row?.name && row?.graph_id);

    if (!usable) {
      throw new Error("Allen API returned structure metadata without usable activation values");
    }

    state.mode = "allen metadata + literature fallback";
    state.sourceStatus =
      "Allen Brain Atlas responded with live structure metadata. Because the API does not directly expose emotional brain-state activation by these regions, the viewer overlays literature-derived relative activation values for cue words.";
  } catch (error) {
    state.mode = "fallback dataset";
    state.sourceStatus =
      `Allen Brain Atlas query unavailable or non-activation-only (${error.message}). Using literature-derived regional activation profiles for fear, memory, learning, focus, stress, and joy.`;
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
