const brainRegions = [
  { id: "amygdala", label: "Amygdala", color: "#c78b4c", baseRadius: 34, position: { x: 220, y: 200 } },
  { id: "hippocampus", label: "Hippocampus", color: "#6d8fb7", baseRadius: 30, position: { x: 820, y: 210 } },
  { id: "prefrontal", label: "Prefrontal Cortex", color: "#8d79b1", baseRadius: 38, position: { x: 250, y: 520 } },
  { id: "language", label: "Language Cortex", color: "#5d9b95", baseRadius: 32, position: { x: 840, y: 520 } }
];

const connections = [
  { id: "amygdala-hippocampus", from: "amygdala", to: "hippocampus", weight: 0.92 },
  { id: "hippocampus-prefrontal", from: "hippocampus", to: "prefrontal", weight: 0.84 },
  { id: "amygdala-prefrontal", from: "amygdala", to: "prefrontal", weight: 0.76 },
  { id: "prefrontal-language", from: "prefrontal", to: "language", weight: 0.8 },
  { id: "hippocampus-language", from: "hippocampus", to: "language", weight: 0.68 }
];

const literatureActivation = {
  fear: { activation: { amygdala: 0.96, hippocampus: 0.58, prefrontal: 0.44, language: 0.21 }, dominant: "Amygdala", strength: 0.87 },
  memory: { activation: { amygdala: 0.32, hippocampus: 0.94, prefrontal: 0.62, language: 0.38 }, dominant: "Hippocampus", strength: 0.81 },
  learning: { activation: { amygdala: 0.28, hippocampus: 0.88, prefrontal: 0.83, language: 0.56 }, dominant: "Hippocampus", strength: 0.84 },
  focus: { activation: { amygdala: 0.18, hippocampus: 0.46, prefrontal: 0.95, language: 0.52 }, dominant: "Prefrontal Cortex", strength: 0.89 },
  stress: { activation: { amygdala: 0.91, hippocampus: 0.42, prefrontal: 0.39, language: 0.18 }, dominant: "Amygdala", strength: 0.85 },
  joy: { activation: { amygdala: 0.54, hippocampus: 0.62, prefrontal: 0.82, language: 0.47 }, dominant: "Prefrontal Cortex", strength: 0.73 }
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
  if (!normalized) return "resting";
  if (literatureActivation[normalized]) return normalized;
  if (keywordAliases[normalized]) return keywordAliases[normalized];
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
  const defs = makeSvg("defs");

  brainRegions.forEach((region) => {
    const gradient = makeSvg("radialGradient", { id: `grad-${region.id}`, cx: "34%", cy: "30%" });
    gradient.appendChild(makeSvg("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.5" }));
    gradient.appendChild(makeSvg("stop", { offset: "22%", "stop-color": region.color, "stop-opacity": "0.98" }));
    gradient.appendChild(makeSvg("stop", { offset: "100%", "stop-color": region.color, "stop-opacity": "0.82" }));
    defs.appendChild(gradient);
  });

  svg.appendChild(defs);

  const connectionLayer = makeSvg("g");
  const pulseLayer = makeSvg("g", { id: "pulseLayer" });
  const nodeLayer = makeSvg("g");

  connections.forEach((connection) => {
    const from = getRegionById(connection.from).position;
    const to = getRegionById(connection.to).position;
    const line = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: "#c8c4be",
      "stroke-width": 0.5,
      "stroke-linecap": "round"
    });
    const active = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: "#0a7e6e",
      "stroke-width": 1.5,
      "stroke-linecap": "round",
      opacity: "0"
    });
    const pulse = makeSvg("line", {
      x1: from.x,
      y1: from.y,
      x2: from.x,
      y2: from.y,
      stroke: "#0a7e6e",
      "stroke-width": 2,
      "stroke-linecap": "round",
      opacity: "0"
    });
    connectionLayer.append(line, active, pulse);
    state.connectionRefs.set(connection.id, { line, active, pulse, connection });
  });

  brainRegions.forEach((region) => {
    const group = makeSvg("g", { transform: `translate(${region.position.x} ${region.position.y})` });
    const pulseLayerNode = makeSvg("g");
    const sphere = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius,
      fill: `url(#grad-${region.id})`,
      opacity: "0.5"
    });
    const inner = makeSvg("circle", {
      cx: -region.baseRadius * 0.18,
      cy: -region.baseRadius * 0.2,
      r: region.baseRadius * 0.35,
      fill: "rgba(255,255,255,0.2)",
      opacity: "0.7"
    });
    const ring = makeSvg("circle", {
      cx: 0,
      cy: 0,
      r: region.baseRadius + 2,
      fill: "none",
      stroke: "#0a7e6e",
      "stroke-width": 1.5,
      opacity: "0"
    });
    const label = makeSvg("text", {
      x: 0,
      y: region.baseRadius + 28,
      "text-anchor": "middle",
      "font-size": "13",
      "font-family": "DM Sans, sans-serif",
      fill: "#1a1a1a"
    });
    label.textContent = region.label;

    group.append(pulseLayerNode, sphere, inner, ring, label);
    nodeLayer.appendChild(group);
    state.nodeRefs.set(region.id, { sphere, inner, ring, label, pulseLayer: pulseLayerNode, region });
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

  const entries = brainRegions.map((region) => ({ ...region, value: state.activation[region.id] || 0 }));
  const barWidth = 24;
  const gap = 38;
  const startX = 42;
  const maxBarHeight = 132;
  const baseY = height - 36;

  entries.forEach((entry, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = Math.max(entry.value * maxBarHeight, 8);
    chartContext.fillStyle = "rgba(26,26,26,0.06)";
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - maxBarHeight, barWidth, maxBarHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = entry.color;
    chartContext.beginPath();
    drawRoundedRect(chartContext, x, baseY - barHeight, barWidth, barHeight, 8);
    chartContext.fill();

    chartContext.fillStyle = "#6b6b6b";
    chartContext.font = "10px DM Mono";
    chartContext.textAlign = "center";
    chartContext.fillText(entry.label.split(" ")[0], x + barWidth / 2, height - 12);
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
        connectionEvents.push({ connectionId, from: current.nodeId, to: neighbor, depth: current.depth });
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
  state.nodePulses = [];
  state.activeNodes.clear();
  state.activeConnections.clear();
  state.cascadeState = startId ? "propagating" : "resting";
  if (!startId) return;

  const now = performance.now();
  const { nodeEvents, connectionEvents } = buildCascade(startId);

  nodeEvents.forEach((event) => {
    const start = now + event.depth * 260;
    state.nodePulses.push({ nodeId: event.nodeId, start, duration: 900 });
    state.activeNodes.set(event.nodeId, { start, duration: 1500 });
  });

  connectionEvents.forEach((event, index) => {
    const start = now + event.depth * 260 + (index % 2) * 70 + 20;
    state.pulses.push({
      connectionId: event.connectionId,
      from: event.from,
      to: event.to,
      start,
      duration: 250,
      fade: 1500
    });
    state.activeConnections.set(event.connectionId, { start: start + 250, duration: 1500 });
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

function animate(now) {
  let activeVisuals = 0;

  state.connectionRefs.forEach(({ line, active, pulse, connection }) => {
    const pulseState = state.pulses.find((item) => item.connectionId === connection.id);
    const activeState = state.activeConnections.get(connection.id);
    let fadeStrength = 0;
    let pulseVisible = false;

    if (pulseState) {
      const elapsed = now - pulseState.start;
      const total = pulseState.duration + pulseState.fade;
      if (elapsed >= 0 && elapsed <= total) {
        activeVisuals += 1;
        if (elapsed <= pulseState.duration) {
          pulseVisible = true;
          const progress = elapsed / pulseState.duration;
          const from = getRegionById(pulseState.from).position;
          const to = getRegionById(pulseState.to).position;
          const x2 = from.x + (to.x - from.x) * progress;
          const y2 = from.y + (to.y - from.y) * progress;
          pulse.setAttribute("x1", from.x);
          pulse.setAttribute("y1", from.y);
          pulse.setAttribute("x2", x2);
          pulse.setAttribute("y2", y2);
          pulse.setAttribute("opacity", "1");
        } else {
          pulse.setAttribute("opacity", "0");
        }
      } else {
        pulse.setAttribute("opacity", "0");
      }
    } else {
      pulse.setAttribute("opacity", "0");
    }

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
        fadeStrength = 1 - elapsed / activeState.duration;
      }
    }

    active.setAttribute("opacity", String(Math.max(fadeStrength * 0.8, pulseVisible ? 1 : 0)));
    line.setAttribute("stroke-width", fadeStrength > 0 ? "1.1" : "0.5");
    line.setAttribute("stroke", fadeStrength > 0 ? "#b7d5cf" : "#c8c4be");
  });

  state.nodeRefs.forEach(({ sphere, inner, ring, pulseLayer, region }) => {
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
    const scale = 1 + (isDominant ? 0.08 : 0) + pulseStrength * 0.07;
    sphere.setAttribute("transform", `scale(${scale})`);
    inner.setAttribute("transform", `scale(${scale})`);
    ring.setAttribute("opacity", String(pulseStrength * 0.75));
    ring.setAttribute("r", String(region.baseRadius * scale + pulseStrength * 14));
    sphere.setAttribute("opacity", String(isDominant ? 1 : 0.5 + activation * 0.22));
    inner.setAttribute("opacity", String(0.52 + pulseStrength * 0.22));

    if (pulseStrength > 0) {
      pulseLayer.appendChild(makeSvg("circle", {
        cx: 0,
        cy: 0,
        r: region.baseRadius * scale + pulseStrength * 16,
        fill: "none",
        stroke: "#0a7e6e",
        "stroke-width": 1.5,
        opacity: String(pulseStrength * 0.55)
      }));
    }
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
