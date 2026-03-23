const brainRegions = [
  {
    id: "amygdala",
    label: "Amygdala",
    color: "#d88a44",
    baseRadius: 28,
    depth: 0.9,
    position: { x: 228, y: 416 },
    branches: [
      { x1: -32, y1: -8, x2: -62, y2: -28 },
      { x1: -16, y1: 20, x2: -42, y2: 46 },
      { x1: 18, y1: -22, x2: 40, y2: -52 },
      { x1: 28, y1: 12, x2: 58, y2: 30 }
    ]
  },
  {
    id: "hippocampus",
    label: "Hippocampus",
    color: "#5684b8",
    baseRadius: 24,
    depth: 0.72,
    position: { x: 420, y: 250 },
    branches: [
      { x1: -24, y1: -18, x2: -54, y2: -44 },
      { x1: -24, y1: 16, x2: -52, y2: 34 },
      { x1: 16, y1: -16, x2: 40, y2: -44 },
      { x1: 22, y1: 14, x2: 52, y2: 42 }
    ]
  },
  {
    id: "prefrontal",
    label: "Prefrontal Cortex",
    color: "#8663a9",
    baseRadius: 31,
    depth: 1.06,
    position: { x: 680, y: 206 },
    branches: [
      { x1: -30, y1: -12, x2: -62, y2: -40 },
      { x1: -12, y1: 24, x2: -30, y2: 62 },
      { x1: 20, y1: -24, x2: 40, y2: -58 },
      { x1: 32, y1: 10, x2: 62, y2: 24 }
    ]
  },
  {
    id: "language",
    label: "Language Cortex",
    color: "#4f9e9a",
    baseRadius: 26,
    depth: 0.84,
    position: { x: 760, y: 468 },
    branches: [
      { x1: -28, y1: -12, x2: -56, y2: -36 },
      { x1: -18, y1: 20, x2: -42, y2: 44 },
      { x1: 18, y1: -20, x2: 42, y2: -46 },
      { x1: 22, y1: 14, x2: 54, y2: 24 }
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
    strength: 0.87,
    cascade: ["amygdala", "hippocampus", "prefrontal"]
  },
  memory: {
    activation: { amygdala: 0.32, hippocampus: 0.94, prefrontal: 0.62, language: 0.38 },
    dominant: "Hippocampus",
    strength: 0.81,
    cascade: ["hippocampus", "prefrontal", "language"]
  },
  learning: {
    activation: { amygdala: 0.28, hippocampus: 0.88, prefrontal: 0.83, language: 0.56 },
    dominant: "Hippocampus",
    strength: 0.84,
    cascade: ["hippocampus", "prefrontal", "language"]
  },
  focus: {
    activation: { amygdala: 0.18, hippocampus: 0.46, prefrontal: 0.95, language: 0.52 },
    dominant: "Prefrontal Cortex",
    strength: 0.89,
    cascade: ["prefrontal", "hippocampus", "language"]
  },
  stress: {
    activation: { amygdala: 0.91, hippocampus: 0.42, prefrontal: 0.39, language: 0.18 },
    dominant: "Amygdala",
    strength: 0.85,
    cascade: ["amygdala", "prefrontal", "hippocampus"]
  },
  joy: {
    activation: { amygdala: 0.54, hippocampus: 0.62, prefrontal: 0.82, language: 0.47 },
    dominant: "Prefrontal Cortex",
    strength: 0.73,
    cascade: ["prefrontal", "hippocampus", "amygdala"]
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

const state = {
  currentWord: "resting",
  activeKey: "resting",
  mode: "fallback dataset",
  sourceStatus:
    "Attempting Allen Brain Atlas structure query. Emotional state activation is not directly available there, so the viewer will use literature-derived mappings when the API yields metadata only or the request fails.",
  activation: { amygdala: 0, hippocampus: 0, prefrontal: 0, language: 0 },
  dominant: "resting",
  strength: 0,
  cascadeState: "resting",
  pulses: [],
  nodeRefs: new Map(),
  connectionRefs: new Map(),
  nodeOrder: brainRegions.map((region) => region.id)
};

const svg = document.querySelector("#networkSvg");
const chart = document.querySelector("#activationChart");
const chartContext = chart.getContext("2d");
const currentWordEl = document.querySelector("#currentWord");
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
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
  return node;
}

function formatWord(value) {
  return value.replace(/(^\w)|(\s+\w)/g, (match) => match.toUpperCase());
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getRegionById(id) {
  return brainRegions.find((region) => region.id === id);
}

function getConnectionId(from, to) {
  const direct = `${from}-${to}`;
  if (state.connectionRefs.has(direct)) {
    return direct;
  }
  return `${to}-${from}`;
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
    strength: clamp(sorted[0][1] * 0.86),
    cascade: sorted.slice(0, 3).map(([id]) => id)
  };
}

function renderNetwork() {
  const defs = makeSvg("defs");

  const glowFilter = makeSvg("filter", { id: "signalGlow", x: "-40%", y: "-40%", width: "180%", height: "180%" });
  glowFilter.appendChild(makeSvg("feGaussianBlur", { stdDeviation: "3.2", result: "blur" }));
  glowFilter.appendChild(makeSvg("feMerge"));
  defs.appendChild(glowFilter);

  const somaGradient = makeSvg("radialGradient", { id: "somaShade", cx: "32%", cy: "28%" });
  somaGradient.appendChild(makeSvg("stop", { offset: "0%", "stop-color": "rgba(255,255,255,0.95)" }));
  somaGradient.appendChild(makeSvg("stop", { offset: "100%", "stop-color": "rgba(255,255,255,0)" }));
  defs.appendChild(somaGradient);

  svg.appendChild(defs);

  const baseLayer = makeSvg("g");
  const connectionLayer = makeSvg("g");
  const nodeLayer = makeSvg("g");
  const pulseLayer = makeSvg("g", { id: "pulseLayer" });

  const gridGroup = makeSvg("g", { opacity: "0.33" });
  for (let x = 40; x < 980; x += 80) {
    gridGroup.appendChild(makeSvg("line", {
      x1: x,
      y1: 0,
      x2: x,
      y2: 720,
      stroke: "rgba(90, 102, 120, 0.12)",
      "stroke-width": 1
    }));
  }
  for (let y = 40; y < 720; y += 80) {
    gridGroup.appendChild(makeSvg("line", {
      x1: 0,
      y1: y,
      x2: 980,
      y2: y,
      stroke: "rgba(90, 102, 120, 0.12)",
      "stroke-width": 1
    }));
  }
  baseLayer.appendChild(gridGroup);

  connections.forEach((connection) => {
    const from = getRegionById(connection.from);
    const to = getRegionById(connection.to);
    const line = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "rgba(105,116,132,0.42)",
      "stroke-width": 2.2,
      "stroke-linecap": "round"
    });
    connectionLayer.appendChild(line);

    const glow = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "rgba(255,255,255,0)",
      "stroke-width": 4.4,
      "stroke-linecap": "round",
      opacity: "0"
    });
    connectionLayer.appendChild(glow);
    state.connectionRefs.set(connection.id, { line, glow, connection });
  });

  brainRegions.forEach((region) => {
    const regionGroup = makeSvg("g", {
      transform: `translate(${region.position.x} ${region.position.y})`
    });

    region.branches.forEach((branch) => {
      regionGroup.appendChild(makeSvg("line", {
        x1: branch.x1,
        y1: branch.y1,
        x2: branch.x2,
        y2: branch.y2,
        stroke: "rgba(76, 88, 106, 0.72)",
        "stroke-width": 3,
        "stroke-linecap": "round"
      }));
      regionGroup.appendChild(makeSvg("circle", {
        cx: branch.x2,
        cy: branch.y2,
        r: 3.4,
        fill: "rgba(95, 106, 123, 0.56)"
      }));
    });

    const somaShadow = makeSvg("circle", {
      cx: 8,
      cy: 10,
      r: region.baseRadius * region.depth,
      fill: "rgba(67,78,95,0.08)"
    });
    regionGroup.appendChild(somaShadow);

    const soma = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius * region.depth,
      fill: region.color,
      opacity: "0.9",
      stroke: "rgba(255,255,255,0.65)",
      "stroke-width": 1.2
    });
    regionGroup.appendChild(soma);

    const highlight = makeSvg("circle", {
      cx: -region.baseRadius * 0.24,
      cy: -region.baseRadius * 0.3,
      r: region.baseRadius * 0.44,
      fill: "rgba(255,255,255,0.16)"
    });
    regionGroup.appendChild(highlight);

    const ring = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius * region.depth + 8,
      fill: "none",
      stroke: region.color,
      "stroke-width": 1.5,
      opacity: "0.18"
    });
    regionGroup.appendChild(ring);

    const label = makeSvg("text", {
      x: 0,
      y: region.baseRadius * region.depth + 34,
      "text-anchor": "middle",
      "font-size": "16",
      "font-family": "IBM Plex Mono, monospace",
      fill: "#394558",
      opacity: "0.88"
    });
    label.textContent = region.label;
    regionGroup.appendChild(label);

    nodeLayer.appendChild(regionGroup);
    state.nodeRefs.set(region.id, { group: regionGroup, soma, ring, label, region });
  });

  svg.append(baseLayer, connectionLayer, pulseLayer, nodeLayer);
}

function drawChart() {
  const width = chart.width;
  const height = chart.height;
  chartContext.clearRect(0, 0, width, height);

  chartContext.save();
  chartContext.strokeStyle = "rgba(72, 84, 102, 0.18)";
  chartContext.lineWidth = 1;
  for (let y = 24; y < height - 24; y += 34) {
    chartContext.beginPath();
    chartContext.moveTo(18, y);
    chartContext.lineTo(width - 18, y);
    chartContext.stroke();
  }

  const entries = brainRegions.map((region) => ({
    ...region,
    value: state.activation[region.id] || 0
  }));

  const barWidth = 48;
  const gap = 22;
  const startX = 34;
  const maxBarHeight = 126;
  const baseY = height - 48;

  entries.forEach((entry, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = entry.value * maxBarHeight;
    const gradient = chartContext.createLinearGradient(0, baseY - barHeight, 0, baseY);
    gradient.addColorStop(0, `${entry.color}dd`);
    gradient.addColorStop(1, `${entry.color}66`);

    chartContext.fillStyle = gradient;
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - barHeight, barWidth, Math.max(barHeight, 8), 10);
    chartContext.fill();

    chartContext.fillStyle = "#445064";
    chartContext.font = "11px IBM Plex Mono";
    chartContext.textAlign = "center";
    chartContext.fillText(entry.label.split(" ")[0], x + barWidth / 2, height - 18);
    chartContext.fillText(`${Math.round(entry.value * 100)}%`, x + barWidth / 2, baseY - barHeight - 10);
  });

  chartContext.restore();
}

function drawRoundedRect(context, x, y, width, height, radius) {
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
    return;
  }

  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
}

function updateReadouts() {
  currentWordEl.textContent = state.currentWord;
  const activeRegions = Object.values(state.activation).filter((value) => value >= 0.3).length;
  activeRegionsEl.textContent = String(activeRegions);
  dominantRegionEl.textContent = state.dominant;
  connectionStrengthEl.textContent = state.strength.toFixed(2);
  signalCascadeEl.textContent = state.cascadeState;
  dataModeEl.textContent = state.mode;
  sourceStatusEl.textContent = state.sourceStatus;
  drawChart();
}

function triggerCascade(cascade) {
  state.pulses = [];
  state.cascadeState = cascade.length ? "propagating" : "resting";

  cascade.slice(0, 3).forEach((nodeId, index) => {
    const nextId = cascade[index + 1];
    if (!nextId) {
      return;
    }
    const connectionId = getConnectionId(nodeId, nextId);
    const connectionRef = state.connectionRefs.get(connectionId);
    if (!connectionRef) {
      return;
    }
    state.pulses.push({
      connectionId,
      progress: -index * 0.22,
      speed: 0.007 + index * 0.0012
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
        : { activation: { amygdala: 0, hippocampus: 0, prefrontal: 0, language: 0 }, dominant: "resting", strength: 0, cascade: [] };

  state.currentWord = word || "resting";
  state.activeKey = resolved || "custom";
  state.activation = scenario.activation;
  state.dominant = scenario.dominant;
  state.strength = scenario.strength;
  triggerCascade(scenario.cascade);
  updateReadouts();
}

function animate() {
  let activePulseCount = 0;

  state.connectionRefs.forEach(({ line, glow, connection }) => {
    const fromActivation = state.activation[connection.from] || 0;
    const toActivation = state.activation[connection.to] || 0;
    const activeLevel = Math.max(fromActivation, toActivation) * connection.weight;
    const isActive = activeLevel > 0.28;

    line.setAttribute("stroke", isActive ? "rgba(118, 126, 138, 0.7)" : "rgba(105,116,132,0.42)");
    line.setAttribute("stroke-width", isActive ? String(2.4 + activeLevel * 1.4) : "2.2");

    glow.setAttribute("stroke", isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0)");
    glow.setAttribute("opacity", isActive ? String(activeLevel * 0.9) : "0");
  });

  state.nodeRefs.forEach(({ soma, ring, region }) => {
    const activation = state.activation[region.id] || 0;
    const baseRadius = region.baseRadius * region.depth;
    soma.setAttribute("r", String(baseRadius + activation * 4));
    soma.setAttribute("opacity", String(0.78 + activation * 0.28));
    ring.setAttribute("opacity", String(0.14 + activation * 0.46));
    ring.setAttribute("r", String(baseRadius + 7 + activation * 6));
  });

  const pulseLayer = document.querySelector("#pulseLayer");
  pulseLayer.innerHTML = "";

  state.pulses.forEach((pulse) => {
    pulse.progress += pulse.speed;
    if (pulse.progress > 1.14) {
      pulse.progress = -0.28;
    }
    if (pulse.progress >= 0 && pulse.progress <= 1) {
      activePulseCount += 1;
      const ref = state.connectionRefs.get(pulse.connectionId);
      if (!ref) {
        return;
      }
      const from = getRegionById(ref.connection.from).position;
      const to = getRegionById(ref.connection.to).position;
      const x = from.x + (to.x - from.x) * pulse.progress;
      const y = from.y + (to.y - from.y) * pulse.progress;

      const bead = makeSvg("circle", {
        cx: x,
        cy: y,
        r: 7.2,
        fill: "rgba(255,255,255,0.96)",
        opacity: "0.92"
      });
      pulseLayer.appendChild(bead);
      pulseLayer.appendChild(makeSvg("circle", {
        cx: x,
        cy: y,
        r: 13,
        fill: "rgba(255,255,255,0.22)"
      }));
    }
  });

  if (state.cascadeState === "propagating" && activePulseCount === 0 && state.pulses.length) {
    state.cascadeState = "resting";
    signalCascadeEl.textContent = state.cascadeState;
  } else if (activePulseCount > 0) {
    signalCascadeEl.textContent = "propagating";
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
  const url =
    `https://api.brain-map.org/api/v2/data/Structure/query.json?criteria=${encodeURIComponent(criteria)}&num_rows=8`;

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
    const word = wordInput.value.trim().toLowerCase();
    applyScenario(word);
  });
}

renderNetwork();
bindEvents();
updateReadouts();
applyScenario("fear");
queryAllenBrainAtlas();
requestAnimationFrame(animate);
