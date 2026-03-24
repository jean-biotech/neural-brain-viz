const brainRegions = [
  { id: "language", label: "Language Cortex", color: "#5fc0b5", glow: "rgba(95, 192, 181, 0.32)", baseRadius: 31, position: { x: 154, y: 128 }, secondary: false },
  { id: "prefrontal", label: "Prefrontal Cortex", color: "#b18df0", glow: "rgba(177, 141, 240, 0.3)", baseRadius: 36, position: { x: 802, y: 118 }, secondary: false },
  { id: "hippocampus", label: "Hippocampus", color: "#7db5ff", glow: "rgba(125, 181, 255, 0.28)", baseRadius: 34, position: { x: 452, y: 350 }, secondary: false },
  { id: "amygdala", label: "Amygdala", color: "#f0aa56", glow: "rgba(240, 170, 86, 0.28)", baseRadius: 30, position: { x: 216, y: 466 }, secondary: false },
  { id: "thalamus", label: "Thalamus", color: "#93b1ff", glow: "rgba(147, 177, 255, 0.22)", baseRadius: 18, position: { x: 332, y: 256 }, secondary: true },
  { id: "basal-ganglia", label: "Basal Ganglia", color: "#d2a1ff", glow: "rgba(210, 161, 255, 0.2)", baseRadius: 16, position: { x: 662, y: 286 }, secondary: true },
  { id: "cerebellum", label: "Cerebellum", color: "#74c7a3", glow: "rgba(116, 199, 163, 0.2)", baseRadius: 17, position: { x: 786, y: 488 }, secondary: true }
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

const regionDefinitions = {
  amygdala: "Processes threat detection and emotional memory formation",
  hippocampus: "Encodes and retrieves spatial and episodic memories",
  prefrontal: "Regulates decision-making, attention and impulse control",
  language: "Coordinates speech production and language comprehension",
  thalamus: "Relays sensory and motor signals to the cerebral cortex",
  "basal-ganglia": "Coordinates voluntary movement and reward processing",
  cerebellum: "Fine-tunes motor control and procedural memory"
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
  activation: Object.fromEntries(brainRegions.map((region) => [region.id, 0])),
  dominant: "resting",
  dominantId: null,
  strength: 0,
  pulses: [],
  nodePulses: [],
  timelineEvents: [],
  activeNodes: new Map(),
  activeConnections: new Map(),
  nodeRefs: new Map(),
  connectionRefs: new Map()
};

const svg = document.querySelector("#networkSvg");
const chart = document.querySelector("#activationChart");
const chartContext = chart.getContext("2d");
const fingerprintChart = document.querySelector("#fingerprintChart");
const fingerprintContext = fingerprintChart.getContext("2d");
const timelineSvg = document.querySelector("#timelineSvg");
const tooltipEl = document.querySelector("#nodeTooltip");
const currentWordEl = document.querySelector("#currentWord");
const dominantRegionEl = document.querySelector("#dominantRegion");
const connectionStrengthEl = document.querySelector("#connectionStrength");
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

function showTooltip(regionId, event) {
  tooltipEl.textContent = regionDefinitions[regionId] || getRegionById(regionId)?.label || "";
  tooltipEl.classList.add("visible");
  tooltipEl.setAttribute("aria-hidden", "false");
  const rect = svg.getBoundingClientRect();
  const width = 220;
  const x = Math.min(rect.width - width - 12, Math.max(12, event.clientX - rect.left + 14));
  const y = Math.max(12, event.clientY - rect.top - 42);
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function hideTooltip() {
  tooltipEl.classList.remove("visible");
  tooltipEl.setAttribute("aria-hidden", "true");
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
  svg.appendChild(makeSvg("rect", { x: 0, y: 0, width: 980, height: 660, fill: "#0a0e1a" }));

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
      stroke: "#304362",
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
    const pulseLayer = makeSvg("g");

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

    [glow, sphere, label].forEach((node) => {
      node.style.cursor = "default";
      node.addEventListener("mouseenter", (event) => showTooltip(region.id, event));
      node.addEventListener("mousemove", (event) => showTooltip(region.id, event));
      node.addEventListener("mouseleave", hideTooltip);
    });

    group.append(glow, sphere, pulseLayer, label);
    nodeLayer.appendChild(group);
    state.nodeRefs.set(region.id, { glow, sphere, pulseLayer, label, region });
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

  const labelMap = { language: "Lang", prefrontal: "PFC", hippocampus: "Hippo", amygdala: "Amyg" };
  const entries = brainRegions.filter((region) => !region.secondary).map((region) => ({
    ...region,
    shortLabel: labelMap[region.id] || region.label,
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
    chartContext.fillText(entry.shortLabel, x + barWidth / 2, height - 12);
  });
}

function drawFingerprintChart() {
  const width = fingerprintChart.width;
  const height = fingerprintChart.height;
  fingerprintContext.clearRect(0, 0, width, height);

  const entries = [
    { id: "amygdala", label: "Amygdala", value: state.activation.amygdala || 0 },
    { id: "hippocampus", label: "Hippocampus", value: state.activation.hippocampus || 0 },
    { id: "prefrontal", label: "Prefrontal", value: state.activation.prefrontal || 0 },
    { id: "language", label: "Language", value: state.activation.language || 0 },
    { id: "thalamus", label: "Thalamus", value: state.activation.thalamus || 0 },
    { id: "cerebellum", label: "Cereb/BG", value: Math.max(state.activation.cerebellum || 0, state.activation["basal-ganglia"] || 0) }
  ];
  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = 72;
  const dominantColor = getRegionById(state.dominantId || "amygdala")?.color || "#fff5c0";

  fingerprintContext.save();
  fingerprintContext.strokeStyle = "rgba(133,145,170,0.18)";
  fingerprintContext.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring += 1) {
    fingerprintContext.beginPath();
    entries.forEach((_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / entries.length;
      const x = centerX + Math.cos(angle) * radius * (ring / 4);
      const y = centerY + Math.sin(angle) * radius * (ring / 4);
      if (index === 0) fingerprintContext.moveTo(x, y);
      else fingerprintContext.lineTo(x, y);
    });
    fingerprintContext.closePath();
    fingerprintContext.stroke();
  }

  entries.forEach((entry, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / entries.length;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    fingerprintContext.beginPath();
    fingerprintContext.moveTo(centerX, centerY);
    fingerprintContext.lineTo(x, y);
    fingerprintContext.stroke();

    fingerprintContext.fillStyle = "#8591aa";
    fingerprintContext.font = "10px DM Sans";
    fingerprintContext.textAlign = "center";
    fingerprintContext.fillText(entry.label, centerX + Math.cos(angle) * (radius + 18), centerY + Math.sin(angle) * (radius + 18));
  });

  fingerprintContext.beginPath();
  entries.forEach((entry, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / entries.length;
    const x = centerX + Math.cos(angle) * radius * entry.value;
    const y = centerY + Math.sin(angle) * radius * entry.value;
    if (index === 0) fingerprintContext.moveTo(x, y);
    else fingerprintContext.lineTo(x, y);
  });
  fingerprintContext.closePath();
  fingerprintContext.fillStyle = `${dominantColor}4d`;
  fingerprintContext.strokeStyle = dominantColor;
  fingerprintContext.lineWidth = 1;
  fingerprintContext.fill();
  fingerprintContext.stroke();
  fingerprintContext.restore();
}

function drawTimeline(now = performance.now()) {
  timelineSvg.innerHTML = "";
  const width = 980;
  const baselineY = 20;

  timelineSvg.appendChild(makeSvg("line", {
    x1: 14,
    y1: baselineY,
    x2: width - 16,
    y2: baselineY,
    stroke: "rgba(133,145,170,0.22)",
    "stroke-width": 1
  }));

  const visible = state.timelineEvents.filter((event) => now >= event.start);
  if (!visible.length) return;

  const maxOffset = Math.max(...visible.map((event) => event.offset), 1);
  const usableWidth = width - 80;
  let prevX = null;

  visible.forEach((event) => {
    const region = getRegionById(event.nodeId);
    const x = 30 + (event.offset / maxOffset) * usableWidth;
    const y = baselineY;

    if (prevX !== null) {
      timelineSvg.appendChild(makeSvg("line", {
        x1: prevX,
        y1: y,
        x2: x,
        y2: y,
        stroke: "rgba(133,145,170,0.42)",
        "stroke-width": 1
      }));
    }

    timelineSvg.appendChild(makeSvg("circle", { cx: x, cy: y, r: 4, fill: region.color }));
    const name = makeSvg("text", {
      x,
      y: 10,
      "text-anchor": "middle",
      "font-size": "8.5",
      "font-family": "DM Sans, sans-serif",
      fill: "#d8e0ef"
    });
    name.textContent = region.label;
    timelineSvg.appendChild(name);

    const stamp = makeSvg("text", {
      x,
      y: 34,
      "text-anchor": "middle",
      "font-size": "8",
      "font-family": "DM Mono, monospace",
      fill: "rgba(133,145,170,0.82)"
    });
    stamp.textContent = `${event.offset}ms`;
    timelineSvg.appendChild(stamp);
    prevX = x;
  });
}

function updateReadouts() {
  currentWordEl.textContent = state.currentWord;
  dominantRegionEl.textContent = state.dominant;
  connectionStrengthEl.textContent = state.strength.toFixed(2);
  drawChart();
  drawFingerprintChart();
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
  state.timelineEvents = [];
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
    state.timelineEvents.push({ nodeId: event.nodeId, start, offset: Math.round(start - now) });
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

  state.connectionRefs.forEach(({ base, trail, glow, connection }) => {
    const pulse = state.pulses.find((item) => item.connectionId === connection.id);
    const activeState = state.activeConnections.get(connection.id);
    let sustained = 0;
    let glowOpacity = 0;

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
        sustained = 1 - elapsed / activeState.duration;
      }
    }

    if (pulse) {
      const elapsed = now - pulse.start;
      const total = pulse.duration + pulse.fade;
      if (elapsed >= 0 && elapsed <= total) {
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
    base.setAttribute("stroke", sustained > 0 ? "#314867" : "#304362");
  });

  state.nodeRefs.forEach(({ glow, sphere, pulseLayer, label, region }) => {
    pulseLayer.innerHTML = "";
    const activation = state.activation[region.id] || 0;
    const activeState = state.activeNodes.get(region.id);
    let pulseStrength = 0;

    if (activeState) {
      const elapsed = now - activeState.start;
      if (elapsed >= 0 && elapsed <= activeState.duration) {
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
  });

  drawTimeline(now);
  requestAnimationFrame(animate);
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
requestAnimationFrame(animate);
