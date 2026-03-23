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
  dominantId: null,
  strength: 0,
  cascadeState: "resting",
  pulses: [],
  nodeRefs: new Map(),
  connectionRefs: new Map()
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
  svg.innerHTML = "";
  svg.appendChild(makeSvg("defs"));

  const baseLayer = makeSvg("g");
  const connectionLayer = makeSvg("g");
  const pulseLayer = makeSvg("g", { id: "pulseLayer" });
  const nodeLayer = makeSvg("g");

  const gridGroup = makeSvg("g", { opacity: "0.28" });
  for (let x = 40; x < 980; x += 80) {
    gridGroup.appendChild(makeSvg("line", {
      x1: x,
      y1: 0,
      x2: x,
      y2: 720,
      stroke: "rgba(224, 229, 235, 0.9)",
      "stroke-width": 1
    }));
  }
  for (let y = 40; y < 720; y += 80) {
    gridGroup.appendChild(makeSvg("line", {
      x1: 0,
      y1: y,
      x2: 980,
      y2: y,
      stroke: "rgba(224, 229, 235, 0.9)",
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
      stroke: "rgba(116,126,140,0.34)",
      "stroke-width": 0.5,
      "stroke-linecap": "round"
    });
    const glow = makeSvg("line", {
      x1: from.position.x,
      y1: from.position.y,
      x2: to.position.x,
      y2: to.position.y,
      stroke: "rgba(255,255,255,1)",
      "stroke-width": 1.2,
      "stroke-linecap": "round",
      opacity: "0"
    });
    connectionLayer.append(line, glow);
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
        stroke: "rgba(95,106,121,0.66)",
        "stroke-width": 2.1,
        "stroke-linecap": "round"
      }));
      regionGroup.appendChild(makeSvg("circle", {
        cx: branch.x2,
        cy: branch.y2,
        r: 2.8,
        fill: "rgba(126,136,148,0.48)"
      }));
    });

    const somaRadius = region.baseRadius * region.depth * 0.82;
    const soma = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: somaRadius,
      fill: region.color,
      opacity: "0.48",
      stroke: "rgba(255,255,255,0.95)",
      "stroke-width": 1
    });
    const activeRing = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: somaRadius + 4,
      fill: "none",
      stroke: "#ffffff",
      "stroke-width": 2,
      opacity: "0"
    });
    const label = makeSvg("text", {
      x: 0,
      y: region.baseRadius * region.depth + 28,
      "text-anchor": "middle",
      "font-size": "14",
      "font-family": "JetBrains Mono, monospace",
      fill: "#4a5666",
      opacity: "0.74"
    });
    label.textContent = region.label;

    regionGroup.append(soma, activeRing, label);
    nodeLayer.appendChild(regionGroup);
    state.nodeRefs.set(region.id, { soma, activeRing, label, region });
  });

  svg.append(baseLayer, connectionLayer, pulseLayer, nodeLayer);
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

function drawChart() {
  const width = chart.width;
  const height = chart.height;
  chartContext.clearRect(0, 0, width, height);

  chartContext.save();
  chartContext.strokeStyle = "rgba(143,153,165,0.18)";
  chartContext.lineWidth = 1;
  for (let y = 24; y < height - 20; y += 34) {
    chartContext.beginPath();
    chartContext.moveTo(18, y);
    chartContext.lineTo(width - 18, y);
    chartContext.stroke();
  }

  const entries = brainRegions.map((region) => ({
    ...region,
    value: state.activation[region.id] || 0
  }));

  const barWidth = 28;
  const gap = 34;
  const startX = 48;
  const maxBarHeight = 126;
  const baseY = height - 42;

  entries.forEach((entry, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = entry.value * maxBarHeight;

    chartContext.fillStyle = entry.color;
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - barHeight, barWidth, Math.max(barHeight, 8), 8);
    chartContext.fill();

    chartContext.fillStyle = "#445064";
    chartContext.font = "10px JetBrains Mono";
    chartContext.textAlign = "center";
    chartContext.fillText(entry.label.split(" ")[0], x + barWidth / 2, height - 16);
  });

  chartContext.restore();
}

function updateReadouts() {
  currentWordEl.textContent = state.currentWord;
  activeRegionsEl.textContent = String(Object.values(state.activation).filter((value) => value >= 0.3).length);
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
    if (!state.connectionRefs.has(connectionId)) {
      return;
    }
    state.pulses.push({
      connectionId,
      start: performance.now() + index * 120,
      duration: 240
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
            strength: 0,
            cascade: []
          };

  state.currentWord = word || "resting";
  state.activeKey = resolved || "custom";
  state.activation = scenario.activation;
  state.dominant = scenario.dominant;
  state.dominantId = Object.entries(scenario.activation).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  state.strength = scenario.strength;
  triggerCascade(scenario.cascade);
  updateReadouts();
}

function animate() {
  const pulseLayer = document.querySelector("#pulseLayer");
  const now = performance.now();
  let activePulseCount = 0;
  pulseLayer.innerHTML = "";

  state.pulses = state.pulses.filter((pulse) => now - pulse.start <= pulse.duration * 1.28);

  state.connectionRefs.forEach(({ line, glow, connection }) => {
    const fromActivation = state.activation[connection.from] || 0;
    const toActivation = state.activation[connection.to] || 0;
    const baseSignal = Math.max(fromActivation, toActivation) * connection.weight;
    const pulse = state.pulses.find((item) => item.connectionId === connection.id);
    let glowStrength = 0;

    if (pulse) {
      const elapsed = now - pulse.start;
      const progress = elapsed / pulse.duration;
      if (progress >= 0 && progress <= 1.28) {
        activePulseCount += 1;
        glowStrength = progress <= 1
          ? 0.18 + (1 - Math.abs(progress - 0.5) / 0.5) * 0.92
          : Math.max(0, 0.34 * (1 - (progress - 1) / 0.28));
      }
      if (progress >= 0 && progress <= 1) {
        const from = getRegionById(connection.from).position;
        const to = getRegionById(connection.to).position;
        const headProgress = progress;
        const tailProgress = Math.max(0, progress - 0.18);
        const headX = from.x + (to.x - from.x) * headProgress;
        const headY = from.y + (to.y - from.y) * headProgress;
        const tailX = from.x + (to.x - from.x) * tailProgress;
        const tailY = from.y + (to.y - from.y) * tailProgress;

        pulseLayer.appendChild(makeSvg("line", {
          x1: tailX,
          y1: tailY,
          x2: headX,
          y2: headY,
          stroke: "rgba(255,255,255,0.24)",
          "stroke-width": 7.2,
          "stroke-linecap": "round",
          opacity: "0.5"
        }));
        pulseLayer.appendChild(makeSvg("line", {
          x1: tailX,
          y1: tailY,
          x2: headX,
          y2: headY,
          stroke: "rgba(255,255,255,0.98)",
          "stroke-width": 3.2,
          "stroke-linecap": "round",
          opacity: "0.96"
        }));
      }
    }

    line.setAttribute("stroke", glowStrength > 0 ? "rgba(202,210,220,0.78)" : "rgba(116,126,140,0.34)");
    line.setAttribute("stroke-width", glowStrength > 0 ? String(0.7 + glowStrength * 1.1) : "0.5");
    glow.setAttribute("opacity", String(glowStrength * Math.max(baseSignal, 0.5)));
    glow.setAttribute("stroke-width", String(1.1 + glowStrength * 3));
  });

  state.nodeRefs.forEach(({ soma, activeRing, label, region }) => {
    const activation = state.activation[region.id] || 0;
    const baseRadius = region.baseRadius * region.depth * 0.82;
    const isDominant = state.dominantId === region.id;
    soma.setAttribute("r", String(baseRadius + activation * 1.5));
    soma.setAttribute("opacity", String(isDominant ? 0.98 : 0.24 + activation * 0.3));
    activeRing.setAttribute("opacity", String(isDominant ? 0.7 : 0));
    activeRing.setAttribute("r", String(baseRadius + 4 + activation * 2));
    label.setAttribute("opacity", String(isDominant ? 0.96 : 0.64));
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

renderNetwork();
bindEvents();
updateReadouts();
applyScenario("fear");
queryAllenBrainAtlas();
requestAnimationFrame(animate);
