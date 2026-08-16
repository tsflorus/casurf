const input = document.getElementById("location-input");
const suggestionsEl = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const emojiEl = document.getElementById("result-emoji");
const messageEl = document.getElementById("result-message");
const spotEl = document.getElementById("result-spot");
const detailsEl = document.getElementById("result-details");
const geolocateBtn = document.getElementById("geolocate-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = {
  search: document.getElementById("tab-search"),
  spots: document.getElementById("tab-spots"),
};
const spotsListEl = document.getElementById("spots-list");

const LEVELS = [
  { max: 20, label: "ça surf pas", emoji: "😴", bg: "#3d4b58" },
  { max: 45, label: "ça surf vite fait", emoji: "🏄", bg: "#2a6f97" },
  { max: 70, label: "ça surf", emoji: "🌊", bg: "#1f8a70" },
  { max: Infinity, label: "ça surf de fou", emoji: "🔥", bg: "#d1495b" },
];

const FAMOUS_SPOTS = [
  { name: "Hossegor", latitude: 43.665, longitude: -1.44 },
  { name: "Biarritz", latitude: 43.4832, longitude: -1.5586 },
  { name: "Lacanau", latitude: 45.0022, longitude: -1.2015 },
  { name: "Seignosse", latitude: 43.704, longitude: -1.437 },
  { name: "Capbreton", latitude: 43.642, longitude: -1.439 },
  { name: "Anglet", latitude: 43.489, longitude: -1.524 },
  { name: "Mimizan", latitude: 44.216, longitude: -1.298 },
  { name: "La Torche", latitude: 47.839, longitude: -4.348 },
  { name: "Nazaré", latitude: 39.6033, longitude: -9.0705 },
  { name: "Ericeira", latitude: 38.963, longitude: -9.416 },
  { name: "Pipeline", latitude: 21.665, longitude: -158.053 },
  { name: "Uluwatu", latitude: -8.829, longitude: 115.088 },
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

geolocateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("La géolocalisation n'est pas disponible sur ce navigateur.");
    return;
  }

  geolocateBtn.disabled = true;
  geolocateBtn.textContent = "Localisation...";
  resultEl.classList.add("hidden");
  showStatus("Récupération de ta position...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      geolocateBtn.disabled = false;
      geolocateBtn.textContent = "📍 Utiliser ma position";
      selectLocation({
        name: "Ma position",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      geolocateBtn.disabled = false;
      geolocateBtn.textContent = "📍 Utiliser ma position";
      const messages = {
        1: "Géolocalisation refusée. Autorise-la dans ton navigateur ou tape une loc à la main.",
        2: "Position indisponible pour le moment.",
        3: "La géolocalisation a mis trop de temps à répondre.",
      };
      showStatus(messages[error.code] || "Impossible de récupérer ta position.");
    },
    { timeout: 10000 }
  );
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

function switchTab(tab) {
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  Object.entries(tabPanels).forEach(([key, el]) => el.classList.toggle("hidden", key !== tab));
  if (tab === "spots") loadSpotsList();
}

let spotsLoaded = false;

function renderSpotRow(spot) {
  const li = document.createElement("li");
  li.className = "spot-row";
  li.innerHTML = `
    <span class="spot-row-emoji">⏳</span>
    <span class="spot-row-name">${spot.name}</span>
    <span class="spot-row-right">
      <span class="spot-row-label">chargement...</span>
      <span class="spot-row-conditions"></span>
    </span>
  `;
  li.addEventListener("click", () => {
    switchTab("search");
    selectLocation(spot);
  });
  return li;
}

async function loadSpotsList() {
  if (spotsLoaded) return;
  spotsLoaded = true;

  spotsListEl.innerHTML = "";
  const rows = FAMOUS_SPOTS.map((spot) => {
    const row = renderSpotRow(spot);
    spotsListEl.appendChild(row);
    return row;
  });

  await Promise.all(
    FAMOUS_SPOTS.map(async (spot, i) => {
      const row = rows[i];
      try {
        const conditions = await fetchConditions(spot.latitude, spot.longitude);
        const score = computeScore(
          conditions.waveHeight,
          conditions.wavePeriod,
          conditions.windSpeed,
          conditions.tideCoefficient
        );
        const level = pickLevel(score);
        row.style.setProperty("--row-color", level.bg);
        row.querySelector(".spot-row-emoji").textContent = level.emoji;
        row.querySelector(".spot-row-label").textContent = level.label;
        row.querySelector(".spot-row-conditions").textContent =
          `${conditions.waveHeight.toFixed(1)}m ${conditions.wavePeriod.toFixed(0)}s · ${conditions.windSpeed.toFixed(0)}km/h`;
      } catch (err) {
        row.querySelector(".spot-row-emoji").textContent = "⚠️";
        row.querySelector(".spot-row-label").textContent = "indisponible";
      }
    })
  );
}

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
  const tideCoefficient = tideCoefficientNow();

  return { waveHeight, wavePeriod, windSpeed, tideCoefficient };
}

// Open-Meteo n'a pas de données de marée (ce sont des prédictions harmoniques
// propres à chaque station, pas un modèle météo). Il n'existe pas d'API de
// marée mondiale gratuite et sans clé, donc on approxime le "coefficient de
// marée" (à la SHOM : vive-eau/morte-eau) à partir de la phase lunaire, ce
// qui est valable partout mais reste une estimation, pas un horaire de marée.
function moonPhaseFraction(date) {
  const synodicMonth = 29.530588853; // jours
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  let phase = (diffDays % synodicMonth) / synodicMonth;
  if (phase < 0) phase += 1;
  return phase; // 0 = nouvelle lune, 0.5 = pleine lune
}

function tideCoefficientNow() {
  const phase = moonPhaseFraction(new Date());
  const coeff = 70 + 50 * Math.cos(4 * Math.PI * phase);
  return Math.round(Math.max(20, Math.min(120, coeff)));
}

function tideLabel(coeff) {
  if (coeff >= 90) return "vive-eau";
  if (coeff >= 45) return "moyenne";
  return "morte-eau";
}

// Léger bonus/malus : les grandes marées bougent bien l'eau (généralement
// favorable) mais deviennent trop rapides/creuses aux extrêmes ; les petites
// marées sont souvent molles. Poids volontairement faible face à la houle/vent.
function tideBonus(coeff) {
  const distanceFromIdeal = Math.abs(coeff - 80);
  return Math.max(-8, 8 - distanceFromIdeal * 0.2);
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

function computeScore(waveHeight, wavePeriod, windSpeed, tideCoefficient) {
  const sizeScore = Math.max(0, Math.min(70, waveHeight * 45));
  const periodScore = Math.max(0, Math.min(20, (wavePeriod - 4) * 2));
  const base = (sizeScore + periodScore) * windFactor(windSpeed);
  return Math.max(0, Math.min(100, base + tideBonus(tideCoefficient)));
}

function pickLevel(score) {
  return LEVELS.find((l) => score < l.max);
}

function renderResult(place, { waveHeight, wavePeriod, windSpeed, tideCoefficient }) {
  const score = computeScore(waveHeight, wavePeriod, windSpeed, tideCoefficient);
  const level = pickLevel(score);

  document.body.style.background = level.bg;
  emojiEl.textContent = level.emoji;
  messageEl.textContent = level.label;
  spotEl.textContent = place.name;
  detailsEl.innerHTML = `
    <div>Houle<span>${waveHeight.toFixed(1)} m</span></div>
    <div>Période<span>${wavePeriod.toFixed(0)} s</span></div>
    <div>Vent<span>${windSpeed.toFixed(0)} km/h</span></div>
    <div>Marée (est.)<span>${tideCoefficient} · ${tideLabel(tideCoefficient)}</span></div>
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
