// Copied from the BirdQuest model hand-over (Perplexity Computer, 2026-11-20).
// Only this comment block was added; the code below is unchanged, so a newer
// version from a retrained model can replace this file directly.
// Used by src/services/tripPlannerService.js.

// BirdQuest occurrence predictor - browser / Node.js (ES module, no dependencies).
// Same logic as birdquest_predictor.py.
//
//   import { BirdQuestPredictor } from "./birdquest-predictor.js";
//   const model = await (await fetch("birdquest_model.json")).json();
//   const bq = new BirdQuestPredictor(model);
//   const r1 = await bq.predictSpecies({ location: "Mai Po", date: "2026-12-05", start: "07:00", end: "10:00", targetSpecies: "Pied Avocet" });
//   const r2 = await bq.recommend({ species: "Pied Avocet", dates: ["2026-12-05", "2026-12-06"] });

export const WEATHER_FIELDS = ["temp_mean_c", "temp_mean_change_1d", "rh_mean_pct", "rainfall_mm", "rain_3d_sum_mm",
  "pressure_change_1d", "cloud_pct", "sunshine_hr", "wind_speed_kmh", "wind_dir_sin", "wind_dir_cos"];
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast?latitude=22.302&longitude=114.174&timezone=Asia%2FHong_Kong" +
  "&past_days=3&forecast_days=16&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum," +
  "pressure_msl_mean,cloud_cover_mean,sunshine_duration,wind_speed_10m_mean,wind_direction_10m_dominant";
const LEVELS = ["low", "medium", "high"];
const rad = (x) => (x * Math.PI) / 180, deg = (x) => (x * 180) / Math.PI;
// Python's round() is banker's rounding; mimic it so sunrise matches the training data exactly.
const pyRound = (x) => { const f = Math.floor(x), r = x - f; if (Math.abs(r - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1; return Math.round(x); };

function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; }
function toOrdinal({ y, m, d }) { // proleptic Gregorian ordinal, same as Python date.toordinal()
  const days = Date.UTC(y, m - 1, d) / 86400000; return days + 719163;
}
function dayOfYear({ y, m, d }) { return (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000 + 1; }
function addDays(s, k) { const { y, m, d } = parseDate(s); return new Date(Date.UTC(y, m - 1, d + k)).toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const r3 = (x) => Math.round(x * 1000) / 1000;
function haversine(lat1, lon1, lat2, lon2) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export function sunTimes(dateStr, lat = 22.3019, lon = 114.1742, tz = 8) {
  const jd = toOrdinal(parseDate(dateStr)) + 1721424.5 + 0.5 - tz / 24;
  const t = (jd - 2451545.0) / 36525.0;
  const L0 = (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const Mr = rad(M);
  const C = Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * t) + Math.sin(3 * Mr) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const appLong = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(appLong))));
  const y = Math.tan(rad(eps / 2)) ** 2, L0r = rad(L0);
  const eqt = 4 * deg(y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
    - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
  const ha = deg(Math.acos(Math.max(-1, Math.min(1, cosHa))));
  const noon = 720 - 4 * lon - eqt + tz * 60;
  return [pyRound(noon - 4 * ha), pyRound(noon + 4 * ha)];
}

export class BirdQuestPredictor {
  constructor(model, { today = null, fetchFn = (typeof fetch !== "undefined" ? fetch : null) } = {}) {
    this.m = model; this.feat = model.feature_order; this.fidx = Object.fromEntries(this.feat.map((f, i) => [f, i]));
    this.sp = model.species; this.locs = model.locations; this.thr = this.sp.map((s) => s.threshold);
    this.today = today || new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // HK date
    this.fetchFn = fetchFn; this._wx = null;
  }

  // ---------------- core model ----------------
  predictRow(x) {
    const { coef, intercept } = this.m.logreg, { weights, biases } = this.m.mlp, S = this.sp.length;
    const out = new Array(S);
    let h = x;
    for (let l = 0; l < weights.length; l++) {
      const W = weights[l], b = biases[l], n = b.length, z = b.slice();
      for (let i = 0; i < h.length; i++) { const hi = h[i]; if (hi === 0) continue; const Wi = W[i]; for (let k = 0; k < n; k++) z[k] += hi * Wi[k]; }
      h = l < weights.length - 1 ? z.map((v) => (v > 0 ? v : 0)) : z.map((v) => 1 / (1 + Math.exp(-v)));
    }
    for (let j = 0; j < S; j++) {
      let s = intercept[j]; const c = coef[j]; for (let i = 0; i < x.length; i++) s += c[i] * x[i];
      out[j] = (1 / (1 + Math.exp(-s)) + h[j]) / 2;
    }
    return out;
  }

  // ---------------- inputs ----------------
  findLocation(location) {
    if (Array.isArray(location) || (location && typeof location === "object" && "lat" in location)) {
      const [lat, lon] = Array.isArray(location) ? location : [location.lat, location.lon];
      let best = null, bd = Infinity;
      for (const l of this.locs.filter((x) => x.locality_type === "hotspot")) { const dd = haversine(lat, lon, l.lat, l.lon); if (dd < bd) { bd = dd; best = l; } }
      return [best, Math.round(bd * 100) / 100];
    }
    const q = String(location).trim().toLowerCase();
    const exact = this.locs.find((l) => l.locality_id.toLowerCase() === q); if (exact) return [exact, 0];
    const hits = this.locs.filter((l) => l.locality_type === "hotspot").filter((l) => l.name_en.toLowerCase().includes(q) || l.name_zh.toLowerCase().includes(q));
    if (!hits.length) throw new Error(`Unknown location: ${location}`);
    const tot = (l) => l.train_checklists_by_month.reduce((a, b) => a + b, 0);
    return [hits.reduce((a, b) => (tot(b) > tot(a) ? b : a)), 0];
  }
  findSpecies(s) {
    const q = String(s).trim().toLowerCase();
    let j = this.sp.findIndex((p) => [p.column, p.sci, p.common].map((v) => v.toLowerCase()).includes(q));
    if (j < 0) j = this.sp.findIndex((p) => p.common.toLowerCase().includes(q) || p.sci.toLowerCase().includes(q));
    if (j < 0) throw new Error(`Species not in model: ${s}. The model covers: ${this.sp.map((p) => p.common).join(", ")}`);
    return j;
  }

  async _openMeteo() {
    if (this._wx === null) {
      try { const r = await this.fetchFn(OPEN_METEO); if (!r.ok) throw new Error(`HTTP ${r.status}`); this._wx = (await r.json()).daily; }
      catch (ex) { console.warn("[weather] Open-Meteo unavailable, using climatology:", ex.message); this._wx = { time: [] }; }
    }
    return this._wx;
  }

  async weatherFor(dateStr) {
    const lead = daysBetween(this.today, dateStr);
    const om = this.fetchFn ? await this._openMeteo() : { time: [] };
    const k = om.time.indexOf(dateStr);
    if (k >= 0) {
      const cal = this.m.weather_calibration_open_meteo_to_hko;
      const get = (field, i) => { const c = cal[field], v = om[c.open_meteo_field][i]; return v == null ? null : v * c.unit_scale * c.slope + c.intercept; };
      const w = { temp_mean_c: get("temp_mean_c", k), rh_mean_pct: get("rh_mean_pct", k), rainfall_mm: Math.max(0, get("rainfall_mm", k) ?? 0),
        cloud_pct: get("cloud_pct", k), sunshine_hr: Math.max(0, get("sunshine_hr", k) ?? 0), wind_speed_kmh: get("wind_speed_kmh", k) };
      if (k > 0) {
        const t0 = get("temp_mean_c", k - 1), p0 = get("pressure_hpa", k - 1), p1 = get("pressure_hpa", k);
        w.temp_mean_change_1d = t0 == null || w.temp_mean_c == null ? null : w.temp_mean_c - t0;
        w.pressure_change_1d = p0 == null || p1 == null ? null : p1 - p0;
      }
      let rs = 0; for (let i = Math.max(0, k - 2); i <= k; i++) rs += Math.max(0, get("rainfall_mm", i) ?? 0); w.rain_3d_sum_mm = rs;
      const wd = om.wind_direction_10m_dominant[k];
      if (wd != null) { w.wind_dir_sin = Math.sin(rad(wd)); w.wind_dir_cos = Math.cos(rad(wd)); }
      w.source = lead >= 0 ? "open-meteo forecast" : "open-meteo recent"; w.lead_days = lead; return w;
    }
    const clim = this.m.weather_climatology_by_month, mon = parseDate(dateStr).m;
    const w = Object.fromEntries(WEATHER_FIELDS.map((f) => [f, clim[f][mon - 1]]));
    w.source = "climatology (monthly mean)"; w.lead_days = lead; return w;
  }

  buildRow(loc, dateStr, startMin, durationMin, wx) {
    const sc = this.m.numeric_scaler, med = this.m.train_median_z, df = this.m.defaults;
    const [sr, ss] = sunTimes(dateStr), doy = dayOfYear(parseDate(dateStr));
    const raw = { doy_sin: Math.sin(2 * Math.PI * doy / 365.25), doy_cos: Math.cos(2 * Math.PI * doy / 365.25),
      hour_sin: Math.sin(2 * Math.PI * startMin / 1440), hour_cos: Math.cos(2 * Math.PI * startMin / 1440),
      latitude: loc.lat, longitude: loc.lon, duration_min: Math.min(300, Math.max(5, durationMin)),
      distance_km: df.distance_km, n_observers: df.n_observers, daylength_min: ss - sr,
      min_after_sunrise: startMin - sr, min_before_sunset: ss - startMin };
    for (const f of WEATHER_FIELDS) raw[f] = wx[f];
    const x = new Array(this.feat.length).fill(0);
    this.feat.forEach((f, i) => {
      if (f.startsWith("num_")) { const k = f.slice(4), v = raw[k]; x[i] = v == null || Number.isNaN(v) ? med[k] : (v - sc[k].mean) / sc[k].std; }
    });
    x[this.fidx.in_kba] = loc.in_kba;
    x[this.fidx.is_daylight] = sr <= startMin && startMin <= ss ? 1 : 0;
    x[this.fidx["cat_protocol__" + df.protocol]] = 1;
    x[this.fidx["cat_locality_type__" + loc.locality_type]] = 1;
    x[this.fidx["cat_locality_id__" + loc.locality_id]] = 1;
    return x;
  }

  confidence(p, j, loc, month, wx, distKm = 0) {
    let score = 2; const reasons = []; const auc = this.sp[j].test_auc;
    if (auc < 0.8) { score--; reasons.push(`model is less reliable for this species (test AUC ${auc})`); }
    if ((wx.source || "").startsWith("climatology") || (wx.lead_days || 0) > 7) { score--; reasons.push("weather is long-range forecast or climatology"); }
    if (distKm > 3) { score--; reasons.push(`nearest modelled hotspot is ${distKm} km away`); }
    const bm = loc.train_checklists_by_month, win = bm[(month + 10) % 12] + bm[month - 1] + bm[month % 12];
    if (win === 0) { score--; reasons.push("no training checklists at this site within +/-1 month (extrapolated)"); }
    const t = this.thr[j];
    return { level: LEVELS[Math.max(0, score)], label: p >= t ? "likely" : p >= t / 2 ? "possible" : "unlikely", reasons };
  }

  _locOut(l, dist) { return { locality_id: l.locality_id, name_en: l.name_en, name_zh: l.name_zh, lat: l.lat, lon: l.lon, distance_to_input_km: dist }; }

  // ---------------- mode 1 ----------------
  async predictSpecies({ location, date, start = "07:00", end = "10:00", targetSpecies = null, topK = 20, weather = null }) {
    const [loc, dist] = this.findLocation(location), month = parseDate(date).m;
    const wx = weather || (await this.weatherFor(date));
    const s = hm(start); let e = hm(end); if (e <= s) e = s + 60;
    const p = this.predictRow(this.buildRow(loc, date, s, e - s, wx));
    const dur = Math.min(120, e - s), starts = [];
    for (let t = s; t <= Math.max(s, e - dur); t += 30) starts.push(t);
    const P = starts.map((t) => this.predictRow(this.buildRow(loc, date, t, dur, wx)));
    const order = p.map((v, j) => j).sort((a, b) => p[b] - p[a]);
    const ranked = order.slice(0, topK).map((j) => {
      let bi = 0; P.forEach((row, i) => { if (row[j] > P[bi][j]) bi = i; });
      return { species_common: this.sp[j].common, species_sci: this.sp[j].sci, probability: r3(p[j]), best_start: fmt(starts[bi]),
        ...this.confidence(p[j], j, loc, month, wx, dist) };
    });
    const out = { mode: "species_at_location", location: this._locOut(loc, dist), date, time_range: [start, end], weather_used: wx,
      expected_species_count: Math.round(p.reduce((a, b) => a + b, 0) * 10) / 10, ranked_species: ranked,
      prediction_map: this.predictionMap(date, s, e - s, wx, targetSpecies) };
    if (targetSpecies != null) {
      const j = this.findSpecies(targetSpecies);
      out.target_species = { species_common: this.sp[j].common, probability: r3(p[j]), rank: order.indexOf(j) + 1, ...this.confidence(p[j], j, loc, month, wx, dist) };
    }
    return out;
  }

  predictionMap(date, startMin, duration, wx, targetSpecies = null) {
    const j = targetSpecies != null ? this.findSpecies(targetSpecies) : null, month = parseDate(date).m;
    return this.locs.filter((l) => l.locality_type === "hotspot").map((l) => {
      const p = this.predictRow(this.buildRow(l, date, startMin, duration, wx));
      const v = j != null ? p[j] : p.reduce((a, b) => a + b, 0);
      return { locality_id: l.locality_id, name_en: l.name_en, name_zh: l.name_zh, lat: l.lat, lon: l.lon, value: r3(v),
        metric: j != null ? "probability" : "expected_species_count", support_checklists: l.train_checklists_by_month[month - 1] };
    });
  }

  // ---------------- mode 2 ----------------
  // dates: "2026-12-05" | ["2026-12-05","2026-12-07"] (list) | {from:"2026-12-05", to:"2026-12-08"} (range)
  async recommend({ species, dates, startTimes = null, durationMin = null, topN = 10, hotspotsOnly = true, weatherByDate = {} }) {
    const j = this.findSpecies(species);
    let ds = typeof dates === "string" ? [dates] : dates;
    if (!Array.isArray(ds)) { ds = []; for (let k = 0; k <= daysBetween(dates.from, dates.to); k++) ds.push(addDays(dates.from, k)); }
    const starts = (startTimes || this.m.defaults.recommend_start_times).map(hm), dur = durationMin || this.m.defaults.duration_min;
    const locs = this.locs.filter((l) => l.locality_type === "hotspot" || !hotspotsOnly);
    const pen = { high: 0, medium: 0.05, low: 0.1 }, cands = [], perLoc = {};
    for (const d of ds) {
      const wx = weatherByDate[d] || (await this.weatherFor(d)), month = parseDate(d).m;
      for (const l of locs) for (const t of starts) {
        const pv = this.predictRow(this.buildRow(l, d, t, dur, wx))[j], c = this.confidence(pv, j, l, month, wx);
        cands.push({ date: d, start: fmt(t), end: fmt(t + dur), location: this._locOut(l, 0), probability: r3(pv), ...c,
          weather_source: wx.source, ranking_score: r3(r3(pv) - pen[c.level]) });
        if (!perLoc[l.locality_id] || pv > perLoc[l.locality_id].value)
          perLoc[l.locality_id] = { locality_id: l.locality_id, name_en: l.name_en, name_zh: l.name_zh, lat: l.lat, lon: l.lon, value: r3(pv), best_date: d, best_start: fmt(t) };
      }
    }
    cands.sort((a, b) => b.ranking_score - a.ranking_score);
    const seen = new Set(), top = [], bestByDate = {};
    for (const c of cands) {
      const k = c.location.locality_id + "|" + c.date; if (!seen.has(k)) { seen.add(k); if (top.length < topN) top.push(c); }
      if (!bestByDate[c.date]) bestByDate[c.date] = c;
    }
    return { mode: "recommend_for_species", species_common: this.sp[j].common, species_sci: this.sp[j].sci, decision_threshold: this.thr[j],
      recommendations: top, best_per_date: Object.values(bestByDate), prediction_map: Object.values(perLoc).sort((a, b) => b.value - a.value) };
  }
}
