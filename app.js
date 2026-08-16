const input = document.getElementById("location-input");
const suggestionsEl = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const emojiEl = document.getElementById("result-emoji");
const messageEl = document.getElementById("result-message");
const spotEl = document.getElementById("result-spot");
const detailsEl = document.getElementById("result-details");

const LEVELS = [
  { max: 20, label: "ça surf pas", emoji: "😴", bg: "#3d4b58" },
  { max: 45, label: "ça surf vite fait", emoji: "🏄", bg: "#2a6f97" },
  { max: 70, label: "ça surf", emoji: "🌊", bg: "#1f8a70" },
  { max: Infinity, label: "ça surf de fou", emoji: "🔥", bg: "#d1495b" },
];

let debounceTimer = null;

input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = input.value.trim();
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  debounceTimer = setTimeout(() => searchLocations(query), 300);
});

document.addEventListener("click", (e) => {
  if (!suggestionsEl.contains(e.target) && e.target !== input) {
    hideSuggestions();
  }
});

async function searchLocations(query) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    renderSuggestions(data.results || []);
  } catch (err) {
    hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (results.length === 0) {
    hideSuggestions();
    return;
  }
  suggestionsEl.innerHTML = "";
  results.forEach((place) => {
    const li = document.createElement("li");
    const region = [place.admin1, place.country].filter(Boolean).join(", ");
    li.textContent = region ? `${place.name} — ${region}` : place.name;
    li.addEventListener("click", () => selectLocation(place));
    suggestionsEl.appendChild(li);
  });
  suggestionsEl.classList.remove("hidden");
}

function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
}

async function selectLocation(place) {
  input.value = place.name;
  hideSuggestions();
  resultEl.classList.add("hidden");
  showStatus(`Récupération des conditions à ${place.name}...`);

  try {
    const conditions = await fetchConditions(place.latitude, place.longitude);
    hideStatus();
    renderResult(place, conditions);
  } catch (err) {
    showStatus("Impossible de récupérer les conditions pour cette loc. Réessaie.");
  }
}

async function fetchConditions(lat, lon) {
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period&timezone=auto`;
  const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;

  const [marineRes, windRes] = await Promise.all([fetch(marineUrl), fetch(windUrl)]);
  const marine = await marineRes.json();
  const wind = await windRes.json();

  const nowIndex = closestHourIndex(marine.hourly.time);
  const waveHeight = marine.hourly.wave_height[nowIndex];
  const wavePeriod = marine.hourly.wave_period[nowIndex];
  const windSpeed = wind.current.wind_speed_10m;

  return { waveHeight, wavePeriod, windSpeed };
}

function closestHourIndex(times) {
  const now = Date.now();
  let bestIndex = 0;
  let bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  });
  return bestIndex;
}

function windFactor(windSpeed) {
  if (windSpeed <= 12) return 1;
  return Math.max(0.2, Math.min(1, 1 - (windSpeed - 12) * 0.03));
}

function computeScore(waveHeight, wavePeriod, windSpeed) {
  const sizeScore = Math.max(0, Math.min(70, waveHeight * 45));
  const periodScore = Math.max(0, Math.min(20, (wavePeriod - 4) * 2));
  return Math.max(0, Math.min(100, (sizeScore + periodScore) * windFactor(windSpeed)));
}

function pickLevel(score) {
  return LEVELS.find((l) => score < l.max);
}

function renderResult(place, { waveHeight, wavePeriod, windSpeed }) {
  const score = computeScore(waveHeight, wavePeriod, windSpeed);
  const level = pickLevel(score);

  document.body.style.background = level.bg;
  emojiEl.textContent = level.emoji;
  messageEl.textContent = level.label;
  spotEl.textContent = place.name;
  detailsEl.innerHTML = `
    <div>Houle<span>${waveHeight.toFixed(1)} m</span></div>
    <div>Période<span>${wavePeriod.toFixed(0)} s</span></div>
    <div>Vent<span>${windSpeed.toFixed(0)} km/h</span></div>
  `;
  resultEl.classList.remove("hidden");
}

function showStatus(text) {
  statusEl.textContent = text;
  statusEl.classList.remove("hidden");
}

function hideStatus() {
  statusEl.classList.add("hidden");
}
