/* webos-touchpad: touchpad + motion (air pointer) remote card for an LG webOS TV (core "LG webOS TV" integration).
   type: custom:webos-touchpad
   entity: media_player.lg_tv        # required, the webostv media player
   pointer: true                     # show the Magic Remote pointer toggle (drag = move cursor, tap = click)
   air_pointer: true                 # show the "point with the phone" (gyro) toggle in pointer mode
   sources: true                     # show a tile per input/app the TV reports (source_list); false hides them
   hide_sources: [Live TV]           # source names to leave out
   top_padding: 12                   # px of space above the first row
   bottom_padding: 12                # px of space below the last row
   screen_corners: true              # on a phone with rounded screen corners (iOS), the bottom row's outer buttons follow the screen's curve when the row sits in them
   screen_radius: {}                 # the screen's corner radius in px: one number for all, or per screen size {"402x874": 62}; default: built in per iPhone screen size (cogwheel)
   settings_button: true             # a cogwheel on the pad: pointer / motion / swipe speed, haptics, tile rows, which tiles and their order (saved in these options; administrators)
   side_padding: 12                  # px of space at the card's left and right edge (0 = edge to edge)
   source_order: [HDMI 1, Netflix]   # show ONLY these tiles, in this order (names as shown, or "HDMI n"); empty = all tiles
   live_tv: true                     # a "Live TV" button (normal TV mode); false = hide it
   hdmi_inputs: 3                    # HDMI 1..N tiles (the TV only lists the active input, so they are always added); 0 = none
   inputs:                           # optional extra inputs the TV does not list (AV, component, ...): pick them in the editor, or set app_id (name/icon optional)
     - { name: Live TV, app_id: com.webos.app.livetv, icon: mdi:antenna }
     - { name: AV, app_id: com.webos.app.externalinput.av1 }
   tv_controls: auto                 # live-TV controls (channel +/-, recall, guide, zap channels, keypad): auto = only while Live TV is on, always, never
   channels: [NPO 1, { name: RTL 4, number: 4 }]   # zap buttons: tap = switch to that channel (by name or number as the TV knows it)
   channel_sort: manual              # manual (default): the order of your channel list (never reordered automatically; use "Sort by number" in the editor); number: always show the buttons sorted by number
   # The zap buttons come from YOUR channel list, stored in Home Assistant per TV (fill it with "Scan now" in the card editor
   # and edit it there). `channels` below is an optional fixed list that is shown first.
   keypad: true                      # number keypad toggle (digits 0-9) in the live-TV controls
   source_style: tiles               # tiles (icon + name) or chips (name only)
   source_colors: true               # colour every tile (brand colour, or a stable own colour per source); false = neutral
   source_rows: 1                    # lines of source tiles, filled evenly (10 tiles: 2 lines = 5+5, 3 lines = 4+4+2); a line wider than the card scrolls sideways; 0 = as many lines as needed, no scrolling
   source_icons:                     # optional: icon (and colour) per source name, overrides the built-in recognition
     Plex: mdi:plex
     Game console: { icon: mdi:controller, color: "#107c10" }
   side_port: 8124                   # port of the optional low-latency side channel (see README); 0 = never use it
   # sensitivity / direction (all optional)
   pointer_speed: 1                  # touch pointer speed multiplier (0.5 = half, 2 = double)
   pointer_invert_x: false           # flip the touch pointer left/right
   pointer_invert_y: false           # flip the touch pointer up/down
   air_speed: 1                      # air pointer (phone motion) speed multiplier
   air_invert_x: false               # flip the air pointer left/right
   air_invert_y: false               # flip the air pointer up/down
   air_swap_axes: false              # swap turn/tilt (use when the phone is held in a different orientation)
   air_deadzone: 1                   # deg/s of rotation ignored (hand tremor); raise it if the cursor drifts
   swipe_step: 46                    # px of dragging per arrow press in arrow mode (lower = more sensitive)
   haptics: true                     # buzz on taps (HA app haptic event / navigator.vibrate)
   show_border: true                 # false = no border / shadow around the card (for pop-ups and stacks that bring their own frame)
   height: auto                      # auto (default): the card is as tall as its content and the pad keeps the ratio below;
                                     # or any CSS height (70vh, 100% = fill the pop-up/section): then the pad takes the spare space
   pad_ratio: 1.3                    # touchpad / keypad width : height ratio when height is auto
   pad_extra: 0                      # px added to that height (e.g. 56 = the same pad as the Apple TV card with player_buttons)
   Swipe = arrow keys (keeps repeating while you drag), tap = OK, tap near an edge = that arrow. */
// Built-in recognition of the big services and input types (matched on the source name, first hit wins). Everything else gets a neutral icon.
// MDI 7 dropped several brand icons (AirPlay, Amazon), so AirPlay is an inline path; everything else is a built-in mdi icon.
const AIRPLAY = "M6,22H18L12,16M21,3H3A2,2 0 0,0 1,5V17A2,2 0 0,0 3,19H7V17H3V5H21V17H17V19H21A2,2 0 0,0 23,17V5A2,2 0 0,0 21,3Z";
const KNOWN = [   // [name regex, mdi icon, colour (null = neutral), optional inline svg path]
  [/netflix/i, "mdi:netflix", "#e50914"], [/youtube/i, "mdi:youtube", "#ff0000"], [/spotify/i, "mdi:spotify", "#1db954"],
  [/prime|amazon/i, "mdi:play-box", "#00a8e1"], [/disney/i, "mdi:castle", "#3b6cf0"], [/hbo|max\b/i, "mdi:movie-open", "#8b5cf6"],
  [/apple\s*tv|\batv\b/i, "mdi:apple", "#a2aaad"], [/airplay/i, "mdi:cast", "#2a6df4", AIRPLAY],
  [/twitch/i, "mdi:twitch", "#9146ff"], [/plex/i, "mdi:plex", "#e5a00d"], [/kodi/i, "mdi:kodi", "#17b2e7"], [/steam/i, "mdi:steam", "#66c0f4"],
  [/npo|nos\b|rtl|kijk|videoland|ziggo|\bard\b|zdf|arte|bbc|itv|channel\s*4/i, "mdi:television-play", null],
  [/hdmi/i, "mdi:hdmi-port", null], [/live\s*tv|tv\s*plus|antenn|tuner/i, "mdi:antenna", null], [/browser|web/i, "mdi:web", null],
  [/cast|screen\s*share|miracast/i, "mdi:cast", null], [/usb|photo|media/i, "mdi:usb-flash-drive", null], [/av\b|composite|component|scart/i, "mdi:video-input-component", null],
  [/setting|menu/i, "mdi:cog", null], [/music|audio/i, "mdi:music", null], [/game/i, "mdi:controller", null],
];
// Sources without a brand colour get their own stable colour from this palette (same name = same colour; neighbours never share one).
const PALETTE = ["#ef5350", "#ff7043", "#ffa726", "#ffca28", "#9ccc65", "#26a69a", "#26c6da", "#42a5f5", "#5c6bc0", "#7e57c2", "#ab47bc", "#ec407a"];
const hash = n => { let h = 5381; for (const ch of n) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return h; };
const iconFor = (name, over) => {
  const o = over && over[name];
  if (o) return typeof o === "string" ? { icon: o, color: null } : { icon: o.icon || "mdi:application-outline", color: o.color || null };
  const k = KNOWN.find(([re]) => re.test(name));
  return k ? { icon: k[1], color: k[2], path: k[3] } : { icon: "mdi:application-outline", color: null };
};
// Typical webOS ids of inputs/system apps the TV does not list as sources (the editor offers them by name; custom ids stay possible).
const KNOWN_INPUTS = [
  { name: "AV 1 (composite)", id: "com.webos.app.externalinput.av1", icon: "mdi:audio-video" },
  { name: "AV 2 (composite)", id: "com.webos.app.externalinput.av2", icon: "mdi:audio-video" },
  { name: "Component", id: "com.webos.app.externalinput.component", icon: "mdi:video-input-component" },
  { name: "TV home screen", id: "com.webos.app.home", icon: "mdi:home-variant" },
  { name: "Web browser", id: "com.webos.app.browser", icon: "mdi:web" },
  { name: "Photos and videos (USB)", id: "com.webos.app.mediadiscovery", icon: "mdi:usb-flash-drive" },
];
const knownInput = id => KNOWN_INPUTS.find(k => k.id === id);
// The tiles of the source strip: HDMI inputs (always added), extra inputs, then the apps the TV lists. A non-empty `source_order` shows only
// those tiles, in that order; empty = all tiles in the default order.
const learnedNames = (c, ls) => { try { return JSON.parse(ls("webosTouchpadHdmi:" + c.entity) || "{}"); } catch (e) { return {}; } };
function buildItems(c, st, names) {
  const apps = c.sources && st && Array.isArray(st.attributes.source_list) ? st.attributes.source_list.filter(s => !(c.hide_sources || []).includes(s)) : [];
  if (c.live_tv === false) { for (let k = apps.length - 1; k >= 0; k--) if (/^live\s*tv$/i.test(apps[k])) apps.splice(k, 1); }   // switched off: also hide a "Live TV" source that the TV lists itself
  const items = [], used = new Set();
  const order = (Array.isArray(c.source_order) ? c.source_order : []).map(x => String(x).trim().toLowerCase()).filter(Boolean);
  const wanted = Math.max(0, ...order.map(x => (/^hdmi\s*(\d)$/.exec(x) || [0, 0])[1] | 0));   // a listed "HDMI n" is always available
  for (let n = 1; n <= Math.min(8, Math.max(wanted, Math.max(0, Math.floor(Number(c.hdmi_inputs)) || 0))); n++) {
    const nm = names[n], listed = nm && apps.includes(nm);
    if (listed) used.add(nm);
    items.push({ name: nm || "HDMI " + n, alias: "HDMI " + n, app: "com.webos.app.hdmi" + n, via: listed ? "source" : "launch", dflt: "mdi:hdmi-port" });
  }
  const extra = Array.isArray(c.inputs) ? c.inputs : [];
  if (c.live_tv !== false && !extra.some(i => i && i.app_id === "com.webos.app.livetv")) {   // the TV does not list Live TV as a source, so it gets its own button
    items.push({ name: "Live TV", app: "com.webos.app.livetv", via: "launch", dflt: "mdi:antenna" });
    for (let k = apps.length - 1; k >= 0; k--) if (/^live\s*tv$/i.test(apps[k])) apps.splice(k, 1);   // avoid a duplicate when it is listed after all
  }
  extra.forEach(i => { if (i && i.app_id) { const k = knownInput(i.app_id); items.push({ name: i.name || (k && k.name.replace(/ \(.*\)$/, "")) || i.app_id, app: i.app_id, via: "launch", dflt: i.icon || (k && k.icon) || "mdi:video-input-component" }); } });
  apps.forEach(n => { if (!used.has(n)) items.push({ name: n, via: "source", dflt: "mdi:application-outline" }); });
  const rank = it => { const r = [it.name, it.alias].filter(Boolean).map(x => order.indexOf(x.toLowerCase())).filter(i => i >= 0); return r.length ? Math.min(...r) : order.length; };
  const out = items.map((it, i) => [it, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
  return order.length ? out.filter(it => rank(it) < order.length) : out;   // a non-empty list is also a filter: only these tiles, in this order
}
const EDGE = 56;   // width (px) of the edge zone where a tap sends an arrow

const fetchChannels = async (hass, entity) => {
  const r = await hass.connection.sendMessagePromise({ type: "webos_pointer/channels", entity_id: entity });
  return { list: r.list || [], tv: r.tv_channels || [], numbers: Object.fromEntries((r.tv_channels || []).filter(c => c.number).map(c => [c.name.toLowerCase(), c.number])) };
};
const stableJson = v => JSON.stringify(v, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, y) => (o[y] = x[y], o), {}) : x);   // JSON with sorted keys (to compare options)
const esc = t => String(t).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m]);
// Screen corner radius (pt = CSS px) per iPhone screen size ("short x long side", "@density" where two models share a size). A page cannot
// read the model or its corner radius, but the screen size tells the family. Approximate; the cogwheel slider corrects it per screen size.
const SCREEN_RADII = { "375x812": 41, "414x896@2": 41.5, "414x896@3": 39, "390x844": 47.33, "428x926": 53.33, "393x852": 55, "430x932": 55, "402x874": 62, "440x956": 62 };
const screenKey = () => { const a = Math.round(Math.min(screen.width, screen.height)), b = Math.round(Math.max(screen.width, screen.height)); return a + "x" + b; };
// Apple's continuous ("squircle") corner of radius 1, as UIKit draws it: three cubic Beziers from the side to the bottom edge.
// Each point is [distance up from the corner along the side, distance along the bottom].
const CONT = [
  [[1.52866483, 0], [1.08849296, 0], [0.86840694, 0], [0.63149379, 0.07491139]],
  [[0.63149379, 0.07491139], [0.37282383, 0.16905956], [0.16905956, 0.37282383], [0.07491139, 0.63149379]],
  [[0.07491139, 0.63149379], [0, 0.86840694], [0, 1.08849296], [0, 1.52866483]]];
class WebosTouchpad extends HTMLElement {
  setConfig(c) {
    if (!c || !c.entity) throw new Error("entity (the LG webOS media player) is required");
    if (this._raw && this._c && stableJson(c) === stableJson(this._raw)) return;   // the dashboard handing back what the cogwheel just saved: nothing to rebuild
    this._raw = JSON.parse(JSON.stringify(c)); this._saved = JSON.parse(JSON.stringify(c));
    this._merge(c); this._build();
  }
  _merge(c) {   // the card's options with their defaults
    this._c = { settings_button: true, pointer: true, air_pointer: true, sources: true, haptics: true, show_border: true, side_port: 8124, live_tv: true, tv_controls: "auto", channels: [], channel_sort: "manual", keypad: true, hdmi_inputs: 3, inputs: [], source_order: [], source_style: "tiles", source_colors: true, source_rows: 1, source_icons: {}, pointer_speed: 1, pointer_invert_x: false, pointer_invert_y: false, air_speed: 1, air_invert_x: false, air_invert_y: false, air_swap_axes: false, air_deadzone: 1, swipe_step: 46, height: "auto", pad_ratio: 1.3, hide_sources: [], ...c };
    if (Array.isArray(this._c.source_icons)) {   // list form from the visual editor -> map by source name
      const m = {}; this._c.source_icons.forEach(i => { if (i && i.name && (i.icon || i.color)) m[i.name] = { icon: i.icon || undefined, color: i.color || undefined }; });
      this._c = { ...this._c, source_icons: m };
    }
  }
  set hass(h) { this._hass = h; this._refresh(); }
  getCardSize() { return 6; }
  static getConfigElement() { return document.createElement("webos-touchpad-editor"); }
  static getStubConfig(hass) {
    const e = Object.keys(hass.states).find(i => i.startsWith("media_player.") && hass.states[i].attributes.source_list);
    return { entity: e || "media_player.lg_tv" };
  }
  // screen_corners: when the card's bottom button row sits in the bottom corners of a phone screen with rounded corners (iOS: there is a
  // home-indicator area, env(safe-area-inset-bottom) > 0), the outer bottom corners of its first and last button follow the screen's curve
  // (screen_radius, px; the page cannot read it: about 55 on recent iPhones, 39 on the X / XS / 11 Pro), round the same centre as the screen's corner (see below).
  // screen_radius: one number for every screen, or per screen size {"402x874": 62, ...} (what the cogwheel slider stores); else SCREEN_RADII, else 55
  _radiusOwn() {   // the value set for this screen (a number for all screens counts too); null = automatic (by model)
    const o = this._c.screen_radius, k = screenKey(), kd = k + "@" + Math.round(window.devicePixelRatio || 1);
    if (Number(o) > 0) return Number(o);
    if (o && typeof o === "object") { const v = Number(o[kd] ?? o[k]); if (v > 0) return v; }
    return null;
  }
  _radius() {
    const o = this._c.screen_radius, k = screenKey(), kd = k + "@" + Math.round(window.devicePixelRatio || 1);
    if (Number(o) > 0) return Number(o);
    if (o && typeof o === "object") { const v = Number(o[kd] ?? o[k]); if (v > 0) return v; }
    return SCREEN_RADII[kd] || SCREEN_RADII[k] || (Math.min(screen.width, screen.height) > 500 ? 18 : 55);   // unknown: a tablet (iPad corners are about 18) or a newer phone
  }
  // A rounded container round the card (a pop-up floating on a desktop or tablet, a dialog): the nearest one whose bottom corners are rounded and
  // hold the bottom row. Its corner is a plain CSS rounding (a quarter ellipse rx x ry); the outer button gets the rounding round the same centre:
  // rx - gap x ry - gap. Only while the button sits in that corner (both gaps under 0.6 of the radius, about equal), as with the screen.
  _containerCorners(rb, bs, reset) {
    for (let n = this.parentElement || (this.getRootNode() && this.getRootNode().host); n && n !== document.documentElement; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
      if (n.nodeType !== 1) continue;
      const cs = getComputedStyle(n), rad = v => { const a = String(v).split(" ").map(parseFloat); return [a[0] || 0, a.length > 1 ? a[1] || 0 : a[0] || 0]; };
      const bl = rad(cs.borderBottomLeftRadius), br = rad(cs.borderBottomRightRadius);
      if (!(bl[0] > 0 || br[0] > 0)) continue;
      const cr = n.getBoundingClientRect();
      if (cr.bottom >= window.innerHeight - 1) return false;   // reaches the screen's bottom edge (a bottom sheet): the screen's corners count
      if (cr.bottom < rb.bottom - 1 || cr.left > rb.left + 1 || cr.right < rb.right - 1 || cr.bottom - rb.bottom > 60) continue;   // not round the bottom row
      const fit = (r, gx, gy) => r[0] > 0 && gx >= -1 && gy >= -1 && gx < r[0] * 0.6 && gy < r[1] * 0.6 && Math.abs(gx - gy) <= Math.max(6, 0.2 * Math.min(r[0], r[1]))
        ? Math.round(Math.max(12, r[0] - gx)) + "px " + Math.round(Math.max(12, r[1] - gy)) + "px" : "";
      const f = bs[0].getBoundingClientRect(), l = bs[bs.length - 1].getBoundingClientRect(), g = [f.left - cr.left, cr.bottom - f.bottom, cr.right - l.right, cr.bottom - l.bottom];
      if (g.every(v => Math.abs(v) < 2)) continue;   // a wrapper flush round the card (a stack, a grid cell): the corner that counts is further out
      const left = fit(bl, g[0], g[1]), right = fit(br, g[2], g[3]);
      if (!left && !right) continue;   // not in this one's corner: perhaps in an outer one
      reset(); bs[0].style.borderBottomLeftRadius = left; bs[bs.length - 1].style.borderBottomRightRadius = right;
      return true;
    }
    return false;
  }
  _onFixed() {   // inside something fixed to the screen (a pop-up / bottom sheet)? On a scrolling page the row only passes the corners now and then
    for (let n = this; n && n !== document.documentElement; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
      if (n.nodeType === 1 && getComputedStyle(n).position === "fixed") return true;
    }
    return false;
  }
  _corners() {
    const sr = this.shadowRoot, card = sr && sr.querySelector("ha-card"); if (!card) return;
    const rows = [...sr.querySelectorAll(".row")].filter(r => r.offsetParent && r.getBoundingClientRect().height);
    this._cornOn = false;
    const reset = () => sr.querySelectorAll(".row button").forEach(b => { if (b.style.borderBottomLeftRadius || b.style.borderBottomRightRadius || b.style.clipPath) { b.style.borderBottomLeftRadius = b.style.borderBottomRightRadius = b.style.clipPath = ""; } });
    if (this._c.screen_corners === false || !rows.length) { reset(); return; }
    let probe = sr.querySelector("#safeb"); if (!probe) { probe = document.createElement("div"); probe.id = "safeb"; probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden"; sr.appendChild(probe); }
    const safe = probe.offsetHeight, row = rows.reduce((a, b) => b.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? b : a), rb = row.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight, gy = vh - rb.bottom;
    const bs = [...row.querySelectorAll("button")].filter(b => !b.hidden && b.offsetParent);
    if (bs.length >= 2 && this._containerCorners(rb, bs, reset)) return;   // a rounded pop-up / dialog round the card: follow its corners
    if (!(safe > 0) || gy < -2 || gy > safe + 40 || bs.length < 2 || !this._onFixed()) { reset(); return; }
    // iPhone screen corners are Apple's "continuous" curve (not a circle): it starts 1.5287 R from the corner and bends gently. Its shape is
    // the one UIKit uses for continuous rounded rectangles: three cubic Beziers (control points in units of R, measured from the corner, see
    // CONT below). That curve is moved inward by the gap and the outer button is cut to it (clip-path polygon), so its edge runs parallel to
    // the screen's. Only while the button sits in the screen's corner (both gaps small and about equal).
    const R = this._radius();
    reset();
    const cut = (b, right) => {
      const r = b.getBoundingClientRect(), gx = right ? vw - r.right : r.left; if (!(gx <= R * 0.35 && gy <= R * 0.35 && Math.abs(gx - gy) <= Math.max(6, R * 0.15))) return;   // really in the corner: close to both edges, about as close to each (else the cut looks wrong)
      const d = (gx + gy) / 2, w = r.width, h = r.height, pts = [];
      // the screen's bottom-left corner, corner at (0, vh); mirrored for the right side. CONT points are (along the side, along the bottom)
      for (const seg of CONT) for (let n = (seg === CONT[0] ? 0 : 1); n <= 10; n++) {
        const P = seg.map(([up, along]) => [along * R, vh - up * R]);
        const t = n / 10, u = 1 - t, b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
        const x = b0 * P[0][0] + b1 * P[1][0] + b2 * P[2][0] + b3 * P[3][0], y = b0 * P[0][1] + b1 * P[1][1] + b2 * P[2][1] + b3 * P[3][1];
        const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]), dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]), len = Math.hypot(dx, dy) || 1;
        const ox = x + d * dy / len, oy = y - d * dx / len;   // inward normal (the screen's inside is up and to the right)
        const sx = right ? vw - ox : ox, lx = Math.max(0, Math.min(w, sx - r.left)), ly = Math.max(0, Math.min(h, oy - r.top));
        pts.push(lx.toFixed(1) + "px " + ly.toFixed(1) + "px");
      }
      // the curve runs from the side (top) to the bottom; the polygon goes round the rest of the button
      const rest = right ? [`${w}px 0px`, `0px 0px`, `0px ${h}px`] : [`0px 0px`, `${w}px 0px`, `${w}px ${h}px`];
      b.style[right ? "borderBottomRightRadius" : "borderBottomLeftRadius"] = "0px";
      b.style.clipPath = `polygon(${rest.join(",")},${pts.slice().reverse().join(",")})`;   // from the bottom along the curve up the outer side
    };
    cut(bs[0], false); cut(bs[bs.length - 1], true); this._cornOn = !!(bs[0].style.clipPath || bs[bs.length - 1].style.clipPath);
  }
  connectedCallback() { clearInterval(this._cornT); this._cornT = setInterval(() => this._corners(), 600);   // the card moves (pop-up sliding in): checked now and then, only reads positions
    // app suspended (iOS): the side-channel socket dies silently but still reads OPEN, so pointer moves vanish until the card is rebuilt -> drop it on every hide/resume
    if (!this._onHide) this._onHide = () => { if (document.visibilityState === "hidden") this._saveNow(); this._dropSide(); };
    document.addEventListener("visibilitychange", this._onHide); window.addEventListener("pageshow", this._onHide); }
  _dropSide() { const w = this._sideWs; this._sideWs = null; this._sideReady = false; this._sideFail = 0; if (w) { w.onclose = w.onerror = null; try { w.close(); } catch (e) {} } }
  disconnectedCallback() { clearInterval(this._cornT); if (this._air) this._setAir(false); document.removeEventListener("visibilitychange", this._onHide); window.removeEventListener("pageshow", this._onHide); this._dropSide(); this._saveNow(); }
  // Quick settings (the cogwheel on the pad, settings_button): they change the card's own options in the dashboard, saved when the panel
  // closes (saving redraws the dashboard, which would close the panel). Needs an administrator. pointer / air / swipe = pointer_speed,
  // air_speed, swipe_step; rows = source_rows; the tiles shown and their order = source_order (and hide_sources).
  _prefs(p) {
    const r = this._raw || {};
    if (p === undefined) return { radius: this._radiusOwn(), pointer: r.pointer_speed, air: r.air_speed, swipe: r.swipe_step, haptics: r.haptics, rows: r.source_rows, apps: {}, order: [] };
    const n = { ...r }, set = (k, v, dflt) => { if (v === undefined || v === null || v === dflt) delete n[k]; else n[k] = v; };
    set("pointer_speed", p.pointer, 1); set("air_speed", p.air, 1); set("swipe_step", p.swipe, 46); set("haptics", p.haptics, true); set("source_rows", p.rows);
    if (p.radius !== undefined && p.radius !== this._radiusOwn()) {   // per screen size (other phones keep theirs); null = automatic by model
      const m = r.screen_radius && typeof r.screen_radius === "object" ? { ...r.screen_radius } : {}, k = screenKey();
      Object.keys(m).forEach(x => { if (x === k || x.startsWith(k + "@")) delete m[x]; });
      if (p.radius !== null) m[k] = Number(p.radius);
      if (Object.keys(m).length) n.screen_radius = m; else delete n.screen_radius; }
    if (Object.keys(p.apps || {}).length || (p.order || []).length) {   // tiles shown and their order -> source_order (shown tiles, in order); shown TV sources leave hide_sources
      let rows = this._tileRows(); if ((p.order || []).length) rows = p.order.map(k => rows.find(x => x.k === k)).filter(Boolean).concat(rows.filter(x => !p.order.includes(x.k)));
      const vis = x => (p.apps && typeof p.apps[x.k] === "boolean") ? p.apps[x.k] : x.vis, shown = rows.filter(vis);
      n.source_order = shown.map(x => x.key);
      if (Array.isArray(n.hide_sources)) { const sk = shown.map(x => x.name.toLowerCase()); n.hide_sources = n.hide_sources.filter(h => !sk.includes(String(h).toLowerCase())); if (!n.hide_sources.length) delete n.hide_sources; }
    }
    this._raw = n; this._merge(n); this._refresh(); this._saveSoon();
  }
  _tileRows() {   // every tile (shown first, in order, then the hidden ones); key = what source_order stores (HDMI tiles by "HDMI n", they keep it when the TV renames them)
    const st = this._st(), names = learnedNames(this._c, this._ls.bind(this)), all = buildItems({ ...this._c, source_order: [], hide_sources: [] }, st, names), shown = buildItems(this._c, st, names);
    const row = (i, vis) => ({ name: i.name, key: i.alias || i.name, k: (i.alias || i.name).toLowerCase(), vis }), ks = shown.map(i => (i.alias || i.name).toLowerCase());
    return shown.map(i => row(i, true)).concat(all.filter(i => !ks.includes((i.alias || i.name).toLowerCase())).map(i => row(i, false)));
  }
  _isAdmin() { return !!(this._hass && this._hass.user && this._hass.user.is_admin); }
  _say(t) { this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message: t }, bubbles: true, composed: true })); }
  _saveSoon() { clearTimeout(this._saveT); this._unsaved = true; if (this._panelOn()) return; this._saveT = setTimeout(() => this._saveNow(), 700); }
  _saveNow() { clearTimeout(this._saveT); if (!this._unsaved) return; this._unsaved = false; this._saveDashboard(); }
  _panelOn() { const b = this.shadowRoot && this.shadowRoot.querySelector("#prefs"); return !!(b && b.classList.contains("on")); }
  async _saveDashboard() {   // write this card's options into the dashboard it is on (the card that had the options as last saved)
    if (!this._isAdmin()) { this._say("Only an administrator can change the card's settings"); return; }
    const conn = this._hass.connection, seg = (location.pathname.split("/")[1] || "").trim(), url = !seg || seg === "lovelace" ? null : seg;
    try {
      const conf = await conn.sendMessagePromise({ type: "lovelace/config", url_path: url, force: false });
      const want = stableJson(this._saved || {}), hits = [];
      const walk = o => { if (Array.isArray(o)) { o.forEach(walk); return; } if (!o || typeof o !== "object") return;
        if (o.type === "custom:webos-touchpad" && o.entity === this._raw.entity) hits.push(o); Object.values(o).forEach(walk); };
      walk(conf);
      const same = hits.filter(h => stableJson(h) === want), target = same.length ? same : hits.length === 1 ? hits : [];
      if (!target.length) { this._say("Could not find this card in the dashboard to save"); return; }
      target.forEach(h => { Object.keys(h).forEach(k => delete h[k]); Object.assign(h, JSON.parse(JSON.stringify(this._raw))); });
      await conn.sendMessagePromise({ type: "lovelace/config/save", url_path: url, config: conf });
      this._saved = JSON.parse(JSON.stringify(this._raw));
    } catch (e) { this._say("Saving the card's settings failed: " + (e && e.message || e)); }
  }
  _prefsOpen(open) {
    const box = this.shadowRoot.querySelector("#prefs"); box.classList.toggle("on", open); if (!open) { this._saveNow(); return; }
    const c = this._c;
    const row = (k, label, min, max, step, val, fmt) => `<label>${label}<span id="pv-${k}">${fmt(val)}</span><input type="range" data-pk="${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
    const x1 = v => "x" + Number(v).toFixed(1), FMT = { pointer: x1, air: x1, swipe: v => v + " px", rows: v => Number(v) ? String(v) : "all", radius: v => v + " px" };
    const rows = this._tileRows(), nr = Math.max(0, Math.floor(Number(c.source_rows))) || 0;
    box.innerHTML = `<div class="ph">Settings<button class="pclose" title="Close"><ha-icon icon="mdi:check"></ha-icon></button></div>` +
      (c.pointer ? row("pointer", "Pointer speed", 0.2, 4, 0.1, Number(c.pointer_speed) || 1, FMT.pointer) : "") +
      (c.pointer && c.air_pointer ? row("air", "Motion pointer speed", 0.2, 4, 0.1, Number(c.air_speed) || 1, FMT.air) : "") +
      row("swipe", "Swipe distance per arrow (lower = more sensitive)", 15, 120, 1, Number(c.swipe_step) || 46, FMT.swipe) +
      `<label class="pt">Haptics<input type="checkbox" data-pk="haptics" ${c.haptics ? "checked" : ""}></label>` +
      (this._cornOn ? `<label class="pt">Screen corner automatic (by phone model)<input type="checkbox" data-pk="rauto" ${this._radiusOwn() === null ? "checked" : ""}></label>` +
        (this._radiusOwn() !== null ? row("radius", `Screen corner for this phone (${screenKey()}): match the buttons below to the screen's curve`, 30, 80, 1, this._radius(), FMT.radius) : "") : "") +
      (rows.length && c.sources ? `<div class="psec">Sources</div>` + row("rows", "Rows of tiles", 0, 4, 1, nr, FMT.rows) +
        rows.map(r => `<div class="papp${r.vis ? "" : " off"}"><input type="checkbox" data-app="${esc(r.k)}" ${r.vis ? "checked" : ""}><span class="pname">${esc(r.name)}</span><span class="pdrag" title="Hold and drag to reorder"><ha-icon icon="mdi:drag-horizontal-variant"></ha-icon></span></div>`).join("") : "") +
      (this._isAdmin() ? `<div class="pnote">Changes are saved in the card's settings on this dashboard, for everyone.</div>` : `<div class="pnote">Only an administrator can change the card's settings.</div>`);
    box.querySelectorAll("input[type=range]").forEach(i => i.oninput = () => { const k = i.dataset.pk, q = this._prefs(); q[k] = Number(i.value); this._prefs(q); if (k === "radius") this._corners(); box.querySelector("#pv-" + k).textContent = FMT[k](i.value); });
    const ra = box.querySelector('input[data-pk="rauto"]'); if (ra) ra.onchange = () => { const q = this._prefs(); q.radius = ra.checked ? null : this._radius(); this._prefs(q); this._corners(); const top = box.scrollTop; this._prefsOpen(true); box.scrollTop = top; };   // automatic: no slider
    box.querySelector('input[data-pk="haptics"]').onchange = e => { const q = this._prefs(); q.haptics = e.target.checked; this._prefs(q); };
    box.querySelectorAll("input[data-app]").forEach(i => i.onchange = () => { const q = this._prefs(); q.apps = { [i.dataset.app]: i.checked }; this._prefs(q); i.closest(".papp").classList.toggle("off", !i.checked); });
    const apps = [...box.querySelectorAll(".papp")], EASE = "cubic-bezier(.2,.8,.2,1)", GAP = 12;
    apps.forEach(rowEl => {   // grab the handle and drag: the row lifts, follows the finger, the others flow aside; on release the order is stored
      const h = rowEl.querySelector(".pdrag"); let st = null;
      const place = () => {
        const dy = st.y - st.y0 + box.scrollTop - st.s0;
        rowEl.style.transform = "translateY(" + dy + "px) scale(1.03)";
        const dc = st.c[st.i] + dy; let to = st.i;
        if (dy > 0) { for (let k = st.i + 1; k < st.c.length; k++) if (st.c[k] <= dc) to = k; } else { for (let k = st.i - 1; k >= 0; k--) if (st.c[k] >= dc) to = k; }
        if (to === st.to) return; st.to = to; this._buzz();
        apps.forEach((x, k) => { if (x === rowEl) return; const sh = to > st.i && k > st.i && k <= to ? -(st.h[st.i] + GAP) : to < st.i && k >= to && k < st.i ? st.h[st.i] + GAP : 0; x.style.transform = sh ? "translateY(" + sh + "px)" : ""; });
      };
      h.addEventListener("pointerdown", e => {
        e.preventDefault(); e.stopPropagation(); try { h.setPointerCapture(e.pointerId); } catch (err) {}
        st = { i: apps.indexOf(rowEl), y0: e.clientY, y: e.clientY, s0: box.scrollTop, h: apps.map(x => x.offsetHeight), c: apps.map(x => x.offsetTop + x.offsetHeight / 2) }; st.to = st.i;
        apps.forEach(x => { if (x !== rowEl) x.style.transition = "transform .22s " + EASE; });
        rowEl.classList.add("lift"); rowEl.style.transition = "transform .18s " + EASE; rowEl.style.transform = "scale(1.03)"; this._buzz();
        st.timer = setInterval(() => { const rb = box.getBoundingClientRect(); if (st.y > rb.bottom - 50) box.scrollTop += 10; else if (st.y < rb.top + 50) box.scrollTop -= 10; else return; place(); }, 16);   // near the edge the list scrolls along
      });
      h.addEventListener("pointermove", e => { if (st) { st.y = e.clientY; place(); } });
      const drop = () => {
        if (!st) return; const s = st; st = null; clearInterval(s.timer);
        let off = 0; if (s.to > s.i) for (let k = s.i + 1; k <= s.to; k++) off += s.h[k] + GAP; else for (let k = s.to; k < s.i; k++) off -= s.h[k] + GAP;
        rowEl.style.transition = "transform .22s " + EASE; rowEl.style.transform = "translateY(" + off + "px) scale(1)";
        setTimeout(() => {
          if (s.to !== s.i) { const ks = this._tileRows().map(r => r.k), [it] = ks.splice(s.i, 1); ks.splice(s.to, 0, it); const q = this._prefs(); q.order = ks; this._prefs(q); }
          const top = box.scrollTop; this._prefsOpen(true); box.scrollTop = top;
        }, 240);
      };
      h.addEventListener("pointerup", drop); h.addEventListener("pointercancel", drop);
    });
    box.querySelector(".pclose").onclick = () => this._prefsOpen(false);
    if (!this._isAdmin()) box.querySelectorAll("input, .pdrag").forEach(x => { x.disabled = true; x.style.pointerEvents = "none"; x.style.opacity = ".5"; });
  }

  _build() {
    const c = this._c;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
<style>
ha-card{${c.show_border === false ? "border:none !important;box-shadow:none !important;--ha-card-border-width:0px;" : ""}padding:${Number(c.top_padding) >= 0 && c.top_padding !== "" && c.top_padding !== null && c.top_padding !== undefined ? Number(c.top_padding) : 12}px ${Number(c.side_padding) >= 0 && c.side_padding !== "" && c.side_padding !== null && c.side_padding !== undefined ? Number(c.side_padding) : 12}px ${Number(c.bottom_padding) >= 0 && c.bottom_padding !== "" && c.bottom_padding !== null && c.bottom_padding !== undefined ? Number(c.bottom_padding) : 12}px;display:flex;flex-direction:column;gap:10px;height:${c.height};box-sizing:border-box;overflow:hidden;position:relative;--ratio:${Number(c.pad_ratio) > 0 ? Number(c.pad_ratio) : 1.3}}
ha-card.auto #pad,ha-card.auto #keys{flex:none;min-height:0;aspect-ratio:var(--ratio)}   /* height: auto = content-sized card, pad and keypad share one ratio-based box */
button{cursor:pointer;-webkit-tap-highlight-color:transparent;border:0;color:var(--primary-text-color);font:500 13px var(--paper-font-body1_-_font-family,system-ui)}
.src{display:grid;grid-template-columns:repeat(var(--cols,1),max-content);justify-content:start;align-content:start;gap:8px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;touch-action:pan-x pan-y;scrollbar-width:none;flex:0 0 auto}   /* source_rows lines, evenly filled; a line wider than the card scrolls sideways (all lines together) */
.src.tiles{grid-template-columns:repeat(var(--cols,1),78px)}
.src.all{overflow:visible}
.src.center{justify-content:center}   /* everything fits: centred */
.src:empty{display:none}
.src button{flex:0 0 auto;border-radius:12px;padding:9px 14px;background:var(--secondary-background-color)}
.src.tiles button{width:78px;height:64px;box-sizing:border-box;justify-content:center;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;line-height:1.15}
.src.tiles ha-icon{--mdc-icon-size:28px;color:var(--ic,var(--secondary-text-color))}
.src.tiles.col button{background:color-mix(in srgb,var(--ic) 16%,var(--secondary-background-color))}
.src.tiles.col button.on{background:color-mix(in srgb,var(--ic) 30%,var(--secondary-background-color))}
.src.tiles span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.src button.on{background:color-mix(in srgb,var(--primary-color) 22%,var(--secondary-background-color));box-shadow:inset 0 0 0 2px var(--primary-color)}
.src.chips button.on{background:var(--primary-color);color:var(--text-primary-color,#fff);box-shadow:none}
#pad{position:relative;flex:1 1 0;min-height:110px;border-radius:20px;background:var(--secondary-background-color);touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
#pad ha-icon{position:absolute;opacity:.25;--mdc-icon-size:26px;pointer-events:none}
#pad ha-icon.logo{left:50%;top:50%;margin:-70px 0 0 -70px;--mdc-icon-size:140px;opacity:.07}
#pad .u{top:10px;left:50%;margin-left:-13px}#pad .d{bottom:10px;left:50%;margin-left:-13px}
#pad .l{left:10px;top:50%;margin-top:-13px}#pad .r{right:10px;top:50%;margin-top:-13px}
#pad.flash{background:color-mix(in srgb,var(--primary-color) 25%,var(--secondary-background-color))}
#pad.ptr .u,#pad.ptr .d,#pad.ptr .l,#pad.ptr .r{opacity:0}
.tg{position:absolute;top:8px;width:38px;height:38px;border-radius:50%;background:rgba(127,127,127,.15);opacity:.75;display:none;align-items:center;justify-content:center;padding:0}
#ptr{right:8px}#air{right:54px}#cog{left:8px}
#prefs{display:none;position:absolute;inset:0;z-index:3;padding:12px 16px;box-sizing:border-box;overflow:auto;background:var(--card-background-color,#1c1c1c);border-radius:20px;flex-direction:column;gap:12px;font-size:14px;color:var(--primary-text-color);touch-action:auto;user-select:auto}#prefs.on{display:flex}   /* settings_button: quick settings */
#prefs .ph{display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:16px}#prefs .pclose{border:0;background:rgba(127,127,127,.15);color:inherit;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center}
#prefs label{display:grid;grid-template-columns:1fr auto;gap:4px 8px}#prefs label input[type=range]{grid-column:1 / 3;width:100%;accent-color:var(--primary-color)}#prefs label.pt{align-items:center}#prefs span{opacity:.7}
#prefs .psec{margin-top:6px;font-weight:600;opacity:.8}#prefs .papp{display:grid;grid-template-columns:auto 1fr 40px;gap:6px;align-items:center;border-radius:10px;background:var(--card-background-color,#1c1c1c);position:relative;min-height:36px}#prefs .papp.lift{z-index:3;box-shadow:0 10px 28px rgba(0,0,0,.5);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color,#1c1c1c))}#prefs .pdrag{display:flex;align-items:center;justify-content:center;height:34px;cursor:grab;touch-action:none;opacity:.7}#prefs .pname{opacity:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#prefs .papp.off .pname{opacity:.45}#prefs .papp ha-icon{--mdc-icon-size:20px}#prefs .pnote{font-size:13px;opacity:.65}
.tg.on{background:var(--primary-color);color:var(--text-primary-color,#fff);opacity:1}
.tv{display:none;flex-direction:column;gap:8px;flex:0 0 auto}
.tv.on{display:flex}
#chn{min-height:18px;line-height:18px;font:600 13px var(--paper-font-body1_-_font-family,system-ui);text-align:center;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#zap{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
#zap:empty{display:none}
#zap button{flex:0 0 auto;border-radius:12px;padding:9px 14px;background:var(--secondary-background-color);display:flex;gap:6px;align-items:baseline}
#zap button b{font-weight:700;opacity:.55;font-size:12px}
#keys{display:none;flex:1 1 0;min-height:110px;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:8px}   /* the keypad takes the place of the touchpad */
#keys.on{display:grid}
#keys button{border-radius:14px;background:var(--secondary-background-color);padding:0;font-size:24px;display:flex;align-items:center;justify-content:center}
#keys button:active,.tv .row button:active{filter:brightness(1.4)}
#kpbtn.on{background:var(--primary-color)!important;color:var(--text-primary-color,#fff)}
.row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.row button{border-radius:12px;background:var(--secondary-background-color);padding:12px 4px;display:flex;align-items:center;justify-content:center}
.row button:active{filter:brightness(1.4)}
.row button.off{color:var(--error-color)}
</style>
<ha-card class="${String(c.height).trim() === "auto" ? "auto" : ""}">
  <div id="chn"></div>
  <div class="src" id="src"></div>
  <div class="row">
    <button data-k="vdown" title="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button>
    <button data-k="vup" title="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button>
    <button data-k="mute" title="Mute"><ha-icon icon="mdi:volume-variant-off"></ha-icon></button>
    <button data-k="menu" title="Menu"><ha-icon icon="mdi:menu"></ha-icon></button>
  </div>
  <div id="pad">
    <button class="tg" id="ptr" title="Pointer"><ha-icon icon="mdi:cursor-default"></ha-icon></button>
    <button class="tg" id="air" title="Point with the phone"><ha-icon icon="mdi:cellphone-wireless"></ha-icon></button>
    <button class="tg" id="cog" title="Settings"><ha-icon icon="mdi:cog-outline"></ha-icon></button>
    <div id="prefs"></div>
    <ha-icon class="u" icon="mdi:chevron-up"></ha-icon><ha-icon class="d" icon="mdi:chevron-down"></ha-icon>
    <ha-icon class="l" icon="mdi:chevron-left"></ha-icon><ha-icon class="r" icon="mdi:chevron-right"></ha-icon>
    <ha-icon class="logo" icon="mdi:television-classic"></ha-icon>
  </div>
  <div id="keys"></div>
  <div class="tv" id="tv">
    <div id="zap"></div>
    <div class="row" id="tvrow">
      <button data-b="CHANNELDOWN" title="Channel down"><ha-icon icon="mdi:chevron-down-circle-outline"></ha-icon></button>
      <button data-b="CHANNELUP" title="Channel up"><ha-icon icon="mdi:chevron-up-circle-outline"></ha-icon></button>
      <button data-b="FLASHBACK" title="Previous channel"><ha-icon icon="mdi:undo-variant"></ha-icon></button>
      <button data-b="GUIDE" title="TV guide"><ha-icon icon="mdi:television-guide"></ha-icon></button>
      <button id="kpbtn" title="Number keypad"><ha-icon icon="mdi:dialpad"></ha-icon></button>
    </div>
  </div>
  <div class="row">
    <button id="pwr" title="Power"><ha-icon icon="mdi:power"></ha-icon></button>
    <button data-k="back" title="Back"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
    <button data-k="home" title="Home"><ha-icon icon="mdi:home"></ha-icon></button>
    <button data-k="play" title="Play / pause"><ha-icon icon="mdi:play-pause"></ha-icon></button>
  </div>
</ha-card>`;
    const $ = s => this.shadowRoot.querySelector(s);
    this.shadowRoot.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { this._buzz(); this._send(b.dataset.k); });
    this.shadowRoot.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { this._buzz(); this._svc("webostv", "button", { button: b.dataset.b }); });
    const keys = $("#keys");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DASH", "0", "ENTER"].forEach(d => {   // phone-style keypad: - (sub-channel dash), 0, OK in the bottom row
      const b = document.createElement("button");
      if (d === "DASH") { b.textContent = "–"; b.title = "Dash"; } else if (d === "ENTER") { b.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>'; b.title = "OK"; } else b.textContent = d;
      b.onclick = () => { this._buzz(); this._svc("webostv", "button", { button: d }); }; keys.appendChild(b);
    });
    $("#kpbtn").onclick = () => { this._buzz(); this._keys = !this._keys; this._refresh(); };
    $("#pwr").onclick = () => { this._buzz(); const on = this._st() && this._st().state !== "off"; this._svc("media_player", on ? "turn_off" : "turn_on"); };
    this._ptrPref = this._ls("webosTouchpadPointer") === "1";
    $("#ptr").onclick = () => { this._buzz(); this._setPtr(!this._ptr); if (!this._ptr) this._setAir(false); };
    $("#air").onclick = () => { this._buzz(); this._setAir(!this._air); };
    $("#cog").onclick = () => { this._buzz(); this._prefsOpen(!$("#prefs").classList.contains("on")); };
    // The tile strip scrolls on its own: while it can scroll, its touch/wheel events must not reach the page / pop-up gestures
    // (swipe to close, two-finger gestures, ...), otherwise both react at once. At the ends the browser hands the scroll to the page.
    const strip = $("#src");
    ["touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "wheel"].forEach(t =>
      strip.addEventListener(t, e => { if (strip.scrollWidth > strip.clientWidth + 1) e.stopPropagation(); }, { passive: true }));
    this._pad($("#pad"));
    if (this._ro) this._ro.disconnect();
    if (window.ResizeObserver) { this._ro = new ResizeObserver(() => { const w = this.shadowRoot.querySelector("ha-card").clientWidth; if (w === this._lw) return; this._lw = w; this._layout(); this._sizePad(this.shadowRoot.querySelector("#tv").classList.contains("on")); }); this._ro.observe(this.shadowRoot.querySelector("ha-card")); }
    this._refresh();
  }

  _ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }
  _st() { return this._hass && this._hass.states[this._c.entity]; }
  _svc(d, s, data = {}) { if (this._hass) this._hass.callService(d, s, { entity_id: this._c.entity, ...data }); }
  _buzz() {
    if (!this._c.haptics) return;
    try { window.dispatchEvent(new CustomEvent("haptic", { detail: "light" })); } catch (e) {}
    try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
  }

  _setPtr(on, save = true) {
    this._ptr = on; const $ = s => this.shadowRoot.querySelector(s);
    $("#ptr").classList.toggle("on", on); $("#pad").classList.toggle("ptr", on);
    if (save) { this._ptrPref = on; this._ls("webosTouchpadPointer", on ? "1" : "0"); }
  }

  // air pointer: turning the phone moves the cursor (gyro rotation speed)
  async _setAir(on) {
    if (on && typeof DeviceMotionEvent === "undefined") on = false;
    if (on && typeof DeviceMotionEvent.requestPermission === "function") {   // iOS asks once (needs this tap)
      try { if (await DeviceMotionEvent.requestPermission() !== "granted") on = false; } catch (e) { on = false; }
    }
    this._air = on; this.shadowRoot.querySelector("#air").classList.toggle("on", on);
    if (on && !this._ptr) this._setPtr(true);
    if (on && !this._airH) { this._airH = e => this._gyro && this._gyro(e); window.addEventListener("devicemotion", this._airH); }
    if (!on && this._airH) { window.removeEventListener("devicemotion", this._airH); this._airH = null; }
    if (this._airIO) { this._airIO.disconnect(); this._airIO = null; }   // motion off again when the card scrolls out of view
    if (on) { this._airIO = new IntersectionObserver(en => { if (!en[en.length - 1].isIntersecting) this._setAir(false); }); this._airIO.observe(this); }
  }

  _refresh() {
    if (!this.shadowRoot || !this._c) return;
    const c = this._c, st = this._st(), $ = s => this.shadowRoot.querySelector(s);
    const show = !!c.pointer;
    $("#ptr").style.display = show ? "flex" : "none";
    $("#cog").style.display = c.settings_button !== false ? "flex" : "none";
    $("#air").style.display = show && c.air_pointer ? "flex" : "none";
    if (!show && this._air) this._setAir(false);
    const want = show && this._ptrPref;
    if (want !== !!this._ptr) this._setPtr(want, false);
    $("#pwr").classList.toggle("off", !!st && st.state === "off");
    // live-TV controls
    const live = !!st && st.attributes.app_id === "com.webos.app.livetv", mode = c.tv_controls || "auto";
    const tvOn = mode === "always" || (mode !== "never" && mode !== false && live);
    $("#tv").classList.toggle("on", tvOn);
    $("#kpbtn").style.display = c.keypad === false ? "none" : "";
    $("#tvrow").style.gridTemplateColumns = "repeat(" + (c.keypad === false ? 4 : 5) + ",1fr)";
    const keysOn = tvOn && c.keypad !== false && !!this._keys;
    $("#keys").classList.toggle("on", keysOn);
    $("#pad").style.display = keysOn ? "none" : "";   // keypad and touchpad share the space
    $("#kpbtn").classList.toggle("on", !!this._keys);
    $("#chn").textContent = live && st.attributes.media_title ? st.attributes.media_title : "";
    $("#chn").style.display = $("#chn").textContent ? "" : "none";   // _sizePad gives its space to the touchpad while it is hidden
    // zap buttons: the configured channels first (pinned), then your channel list
    if (!this._srvT) this._fetchSrv();   // your channel list lives on the server (shared by all devices; filled by the scan, edited in the editor)
    const pinned = (Array.isArray(c.channels) ? c.channels : []).map(x => typeof x === "string" || typeof x === "number" ? { name: String(x) } : x).filter(x => x && (x.name || x.number));
    const have = new Set(pinned.map(x => String(x.name || "").toLowerCase()));
    const mine = ((this._srv && this._srv.list) || []).filter(x => x.name && x.enabled !== false && !have.has(x.name.toLowerCase())).map(x => ({ name: x.name, number: x.number || "", own: true }));
    const num = n => this._srv && this._srv.numbers[String(n || "").toLowerCase()];   // channel numbers from the TV's own list, when it has one
    pinned.forEach(p => { if (!p.number && p.name && num(p.name)) p.number = num(p.name); });
    mine.forEach(l => { if (!l.number && num(l.name)) l.number = num(l.name); });
    let zl = pinned.concat(mine);
    if (c.channel_sort !== "manual") {   // default: ascending by channel number; channels without a number follow in list order
      const n = x => { const v = parseFloat(String(x.number || "").replace(",", ".")); return Number.isFinite(v) ? v : Infinity; };
      zl = zl.map((x, i) => [x, i]).sort((a, b) => n(a[0]) - n(b[0]) || a[1] - b[1]).map(x => x[0]);
    }
    const zk = JSON.stringify(zl), zap = $("#zap");
    if (zap.dataset.k !== zk) {
      zap.dataset.k = zk; zap.textContent = "";
      zl.forEach(z => {
        const b = document.createElement("button"); b.title = z.name || String(z.number); if (z.own) b.title += " (hold to hide)";
        b.innerHTML = (z.number ? "<b></b>" : "") + "<span></span>"; if (z.number) b.firstChild.textContent = z.number; b.lastChild.textContent = z.name || "";
        let hold = null, held = false;
        if (z.own) {   // a long press hides a channel (it stays in your list, switched off)
          b.onpointerdown = () => { held = false; hold = setTimeout(() => { held = true; this._buzz(); this._disableChannel(z.name); }, 700); };
          b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(hold);
        }
        b.onclick = () => { if (held) return; this._buzz(); this._svc("media_player", "play_media", { media_content_type: "channel", media_content_id: String(z.number || z.name) }); };
        zap.appendChild(b);
      });
    }
    this._sizePad(tvOn);
    const el = $("#src");
    // Inputs: the TV only lists the active input in source_list, so HDMI 1..hdmi_inputs are always added and launched by app id.
    // The label the TV gives an input (e.g. "ATV") is learned while that input is active and remembered in this browser.
    const lsKey = "webosTouchpadHdmi:" + c.entity;
    const names = learnedNames(c, (k, v) => this._ls(k, v));
    const hm = st && /com\.webos\.app\.hdmi(\d)/.exec(st.attributes.app_id || ""), curSrc = st && st.attributes.source;
    if (hm && curSrc && names[hm[1]] !== curSrc) { names[hm[1]] = curSrc; this._ls(lsKey, JSON.stringify(names)); }
    const items = buildItems(c, st, names);
    const tiles = c.source_style !== "chips", rows = Math.max(0, Math.floor(Number(c.source_rows))) || 0, col = tiles && c.source_colors !== false;
    const key = tiles + "|" + col + "|" + rows + "|" + JSON.stringify(c.source_icons) + "|" + JSON.stringify(items);
    if (el.dataset.k !== key) {
      el.dataset.k = key; el.textContent = ""; el.className = "src " + (tiles ? "tiles" : "chips") + (rows ? "" : " all") + (col ? " col" : ""); this._n = items.length; this._rowsCfg = rows; this._tilesMode = tiles; this._laySig = ""; this._layout();
      const look = it => { const i = iconFor(it.name, c.source_icons); if (i.icon === "mdi:application-outline" && !i.path && !(c.source_icons && c.source_icons[it.name])) i.icon = it.dflt; return i; };
      const taken = new Set(), own = {};   // own colours: probe from the name's hash to the next free palette slot (alphabetical order keeps it stable)
      if (col) [...items].sort((x, y) => x.name.localeCompare(y.name)).forEach(it => {
        const i = look(it); if (i.color) { taken.add(i.color); return; }
        let k = hash(it.name) % PALETTE.length; for (let j = 0; j < PALETTE.length && taken.has(PALETTE[k]); j++) k = (k + 1) % PALETTE.length;
        own[it.name] = PALETTE[k]; taken.add(PALETTE[k]);
      });
      items.forEach(it => {
        const n = it.name, b = document.createElement("button"); b.title = n; b.dataset.s = n; if (it.app) b.dataset.app = it.app;
        if (tiles) {
          const i = look(it), t = document.createElement("span");
          if (col) i.color = i.color || own[n];
          if (i.color) b.style.setProperty("--ic", i.color);
          let ic;
          if (i.path) { ic = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ic.setAttribute("viewBox", "0 0 24 24"); ic.setAttribute("width", "28"); ic.setAttribute("height", "28"); ic.innerHTML = i.path.startsWith("<") ? `<g fill="currentColor">${i.path}</g>` : `<path fill="currentColor" d="${i.path}"/>`; ic.style.color = i.color || "var(--secondary-text-color)"; }
          else { ic = document.createElement("ha-icon"); ic.setAttribute("icon", i.icon); }
          t.textContent = n; b.append(ic, t);
        } else b.textContent = n;
        b.onclick = () => {
          this._buzz();
          if (it.via === "launch") this._svc("webostv", "command", { command: "system.launcher/launch", payload: { id: it.app } });
          else this._svc("media_player", "select_source", { source: n });
        };
        el.appendChild(b);
      });
    }
    this._layout();
    const curApp = st && st.attributes.app_id;
    el.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.app ? b.dataset.app === curApp : b.dataset.s === curSrc));
  }

  // Your channel list: stored per TV in Home Assistant by the integration (ordered, editable, shared by all devices). The integration can
  // append the channels you watch automatically (switch in the card editor); the TV's own channel list supplies the channel numbers.
  async _fetchSrv(force) {
    const now = Date.now(); if (!this._hass || (!force && this._srvT && now - this._srvT < 20000)) return; this._srvT = now;
    try { this._srv = await fetchChannels(this._hass, this._c.entity); this._refresh(); } catch (e) { this._srv = null; }
  }
  async _disableChannel(name) {   // switch a channel off: it stays in the list (turn it on again in the editor)
    if (!this._srv) return;
    this._srv.list = this._srv.list.map(x => x.name === name ? { ...x, enabled: false } : x); this._refresh();
    try { await this._hass.connection.sendMessagePromise({ type: "webos_pointer/set_channels", entity_id: this._c.entity, list: this._srv.list }); } catch (e) {}
  }

  // Constant card size: with height auto the card is as tall as it is on Live TV. When the live-TV block is hidden (other inputs / apps)
  // the touchpad and keypad grow by exactly that block's height instead, so nothing below or above jumps.
  _sizePad(tvOn) {
    const sr = this.shadowRoot, card = sr && sr.querySelector("ha-card"); if (!card || !card.classList.contains("auto")) return;
    const pad = sr.querySelector("#pad"), keys = sr.querySelector("#keys"), tv = sr.querySelector("#tv");
    const w = card.clientWidth - 24; if (w <= 0) return;
    let t = 0;
    if (!tvOn && (this._c.tv_controls || "auto") !== "never") {   // measure the hidden block (and the gap that goes with it)
      const keep = tv.style.cssText; tv.style.cssText = "display:flex;position:absolute;visibility:hidden;width:" + w + "px";
      t = tv.offsetHeight + 10; tv.style.cssText = keep;
    }
    const chnShown = sr.querySelector("#chn").style.display !== "none";
    if (!chnShown && (this._c.tv_controls || "auto") !== "never") t += 28;   // the channel name line (18 px + gap) is hidden too
    const h = Math.round(w / (Number(this._c.pad_ratio) > 0 ? Number(this._c.pad_ratio) : 1.3) + t + (Number(this._c.pad_extra) || 0));
    [pad, keys].forEach(e => { e.style.aspectRatio = "auto"; e.style.height = h + "px"; });
  }

  // Line by line: tiles fill a line left to right and wrap to the next line (flex-wrap). The strip shows at most `source_rows` lines;
  // more tiles scroll vertically, with a peek of the next line so you can see there is more. 0 = show everything.
  _layout() {
    const el = this.shadowRoot && this.shadowRoot.querySelector("#src"); if (!el || !this._n) return;
    const rows = this._rowsCfg || 0, w = el.clientWidth, sig = this._n + "|" + rows + "|" + w + "|" + (this._tilesMode ? 1 : 0);
    if (sig === this._laySig || !w) return;   // only when the tiles or the width change: this runs on every hass update and must not disturb a scroll in progress
    this._laySig = sig;
    // source_rows = number of lines, filled evenly (10 tiles: 2 lines = 5 + 5, 3 lines = 4 + 4 + 2). Fewer lines are used when everything fits
    // in fewer (a few tiles stay on one line); a line wider than the card scrolls sideways. 0 = as many lines as needed, nothing scrolls.
    const fits = Math.max(1, Math.floor((w + 8) / ((this._tilesMode ? 78 : 96) + 8))), need = Math.ceil(this._n / fits);
    const lines = Math.max(1, rows ? Math.min(rows, need) : need), cols = Math.ceil(this._n / lines);
    if (el.style.getPropertyValue("--cols") !== String(cols)) el.style.setProperty("--cols", cols);
    el.classList.remove("center");   // measure left-aligned: when nothing needs to scroll the tiles are centred instead
    if (el.scrollWidth <= el.clientWidth + 1) el.classList.add("center");
  }

  _send(k) {
    const st = this._st();
    const map = { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", ok: "ENTER", back: "BACK", home: "HOME", menu: "MENU" };
    if (map[k]) return this._svc("webostv", "button", { button: map[k] });
    if (k === "play") return this._svc("media_player", "media_play_pause");
    if (k === "mute") return this._svc("media_player", "volume_mute", { is_volume_muted: !(st && st.attributes.is_volume_muted) });
    if (k === "vup") return this._svc("media_player", "volume_up");
    if (k === "vdown") return this._svc("media_player", "volume_down");
  }

  _pad(el) {
    let id = null, x0 = 0, y0 = 0, sx = 0, sy = 0, t0 = 0, moved = 0, px = 0, py = 0, pt = 0, pdx = 0, pdy = 0, ptm = null, gt = 0;
    const flash = () => { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 90); };
    // pointer traffic prefers the optional side channel (wss://<host>:<side_port>/pointer, own thread on HA); falls back to the HA websocket
    const side = () => {
      const port = this._c.side_port;
      if (!port || location.protocol !== "https:" || (this._sideWs && this._sideWs.readyState <= 1) || (this._sideFail && Date.now() - this._sideFail < 60000)) return;
      try {
        const ws = new WebSocket("wss://" + location.hostname + ":" + port + "/pointer"); this._sideWs = ws; this._sideReady = false;
        ws.onopen = () => ws.send(JSON.stringify({ auth: this._hass.auth && this._hass.auth.data && this._hass.auth.data.access_token, entity_id: this._c.entity }));
        ws.onmessage = e => { if (e.data === "ready") this._sideReady = true; };
        ws.onclose = ws.onerror = () => { if (!this._sideReady) this._sideFail = Date.now(); this._sideReady = false; };
      } catch (e) { this._sideFail = Date.now(); }
    };
    const send = (txt, fallback) => {
      side();
      if (this._sideReady && this._sideWs.readyState === 1) this._sideWs.send(txt); else this._hass.connection.sendMessage(fallback);
    };
    const flush = () => {
      ptm = null; const dx = Math.round(pdx), dy = Math.round(pdy); pdx -= dx; pdy -= dy;
      if (dx || dy) send("m " + dx + " " + dy, { type: "webos_pointer/move", dx, dy, entity_id: this._c.entity });
    };
    const IOS = typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
    this._gyro = e => {
      const r = e.rotationRate, now = performance.now(), dt = gt ? Math.min(0.05, (now - gt) / 1000) : 0; gt = now;
      if (!this._air || !r || !dt || (id !== null && Date.now() - t0 < 120)) return;   // first 120 ms of a touch: a tap stays a clean click
      const c = this._c;
      let turn = r.alpha, tilt = IOS ? r.gamma : r.beta;   // phone held upright as a remote
      if (c.air_swap_axes) [turn, tilt] = [tilt, turn];
      const a = Math.abs(turn) > c.air_deadzone ? turn : 0, b = Math.abs(tilt) > c.air_deadzone ? tilt : 0;
      const g = 38 * c.air_speed * Math.min(1.5, 0.3 + Math.hypot(a, b) / 45);   // slow turns = precise, fast ones up to 1.5x
      pdx += -b * dt * g * (c.air_invert_x ? -1 : 1); pdy += -a * dt * g * (c.air_invert_y ? -1 : 1);
      if (!ptm) ptm = setTimeout(flush, 16);
    };
    el.addEventListener("pointerdown", e => {
      if (e.target.closest && (e.target.closest(".tg") || e.target.closest("#prefs"))) return;
      px = e.clientX; py = e.clientY; pt = e.timeStamp;
      id = e.pointerId; x0 = sx = e.clientX; y0 = sy = e.clientY; t0 = Date.now(); moved = 0;
      try { el.setPointerCapture(id); } catch (err) {}
      e.preventDefault();
    });
    el.addEventListener("pointermove", e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
      if (this._ptr) {   // pointer mode: relative cursor moves with acceleration (slow = precise, fast flick = far)
        const mx = e.clientX - px, my = e.clientY - py, v = Math.hypot(mx, my) / Math.max(1, e.timeStamp - pt);
        const g = 1.5 + 8.5 * Math.pow(Math.min(1, Math.max(0, (v - 0.05) / 0.9)), 1.4);
        const c = this._c; pdx += mx * g * c.pointer_speed * (c.pointer_invert_x ? -1 : 1); pdy += my * g * c.pointer_speed * (c.pointer_invert_y ? -1 : 1); px = e.clientX; py = e.clientY; pt = e.timeStamp;
        if (!ptm) ptm = setTimeout(flush, 16);
        return;
      }
      if (Math.abs(dx) < this._c.swipe_step && Math.abs(dy) < this._c.swipe_step) return;
      const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      this._buzz(); flash(); this._send(k);
      x0 = e.clientX; y0 = e.clientY;   // restart so that keeping the drag repeats the key
    });
    el.addEventListener("pointerup", e => {
      if (e.pointerId !== id) return;
      const tap = moved < 12 && Date.now() - t0 < 350;
      id = null;
      if (!tap) return;
      if (this._ptr) { this._buzz(); flash(); send("c", { type: "webos_pointer/click", entity_id: this._c.entity }); return; }
      const r = el.getBoundingClientRect(), dl = sx - r.left, dr = r.right - sx, dt = sy - r.top, db = r.bottom - sy, m = Math.min(dl, dr, dt, db);
      const k = m > EDGE ? "ok" : m === dl ? "left" : m === dr ? "right" : m === dt ? "up" : "down";   // inside = OK, near an edge = that arrow
      if (k === "ok") this._buzz();
      flash(); this._send(k);
    });
    el.addEventListener("pointercancel", () => { id = null; });
    // A pop-up around the card must not react to swipes on the pad: custom_components/tv_touchpad (swipe down to close, side swipes) skips gestures that
    // start on an element flagged __ptzOn, and the touch/pointer events stay on the pad for handlers further up. Harmless without that component.
    el.__ptzOn = true;
    ["touchstart", "touchmove", "touchend", "touchcancel", "mousedown", "mousemove", "mouseup", "pointerdown", "pointermove", "pointerup", "wheel"]
      .forEach(t => el.addEventListener(t, e => e.stopPropagation(), { passive: true }));
  }
}
if (!customElements.get("webos-touchpad")) customElements.define("webos-touchpad", WebosTouchpad);

// Visual editor (card picker / "Edit card"): HA's ha-form with selectors, so no YAML is needed.
const DEFAULTS = { screen_corners: true, settings_button: true, pointer: true, air_pointer: true, sources: true, haptics: true, show_border: true, pointer_speed: 1, pointer_invert_x: false, pointer_invert_y: false,
  air_speed: 1, air_invert_x: false, air_invert_y: false, air_swap_axes: false, air_deadzone: 1, swipe_step: 46, side_port: 8124, height: "auto", pad_ratio: 1.3, pad_extra: 0, live_tv: true, tv_controls: "auto", keypad: true, channel_sort: "manual", hdmi_inputs: 3, source_style: "tiles", source_colors: true, source_rows: 1 };
const num = (min, max, step) => ({ number: { min, max, step, mode: "slider" } });
const FIELD_LABELS = { app_id: "Input", enabled: "Show on the card", name: "Name", number: "Channel number (optional)", app_id: "webOS app id", icon: "Icon", color: "Colour (for example #e50914)" };
const LABELS = {
  entity: ["TV", "The LG webOS TV media player (core LG webOS TV integration)."],
  height: ["Card height", "auto = as tall as the content (default). Or any CSS value, for example 70vh or 100% to fill a pop-up; the touchpad then takes the spare space."],
  pad_ratio: ["Touchpad shape (width / height)", "Only with height auto. Higher = flatter touchpad, lower = taller. The keypad uses the same size."],
  pad_extra: ["Extra touchpad height", "Pixels added to the touchpad (and keypad) height, on top of the shape above. 56 = the same pad as the Apple TV card with its player buttons."],
  pointer: ["Pointer toggle", "Show the Magic Remote pointer button on the pad (drag = move the TV cursor, tap = click)."],
  air_pointer: ["Motion (air) pointer toggle", "Show the button that lets you move the cursor by turning your phone."],
  sources: ["Source tiles", "Show a tile for every input / app the TV reports."],
  source_style: ["Source style", "Tiles = icon and name (big services get their icon and colour, the rest a neutral icon), chips = name only."],
  source_order: ["Tiles to show (and their order)", "Pick the tiles you want, in the order you want them (drag to reorder). Only these are shown. Leave empty to show all tiles. You can also type a name."],
  tv_controls: ["Live TV controls", "Channel up/down, previous channel, guide, your channel buttons and the keypad. Auto = only while the TV is on Live TV."],
  channel_sort: ["Channel order", "Order of the list (default): the list is never reordered automatically, new channels are added at the end. Or always show the buttons sorted by channel number."],
  keypad: ["Number keypad", "Show the keypad button in the live-TV controls. The keypad (0-9, dash, OK) takes the place of the touchpad while it is open."],
  live_tv: ["Live TV button", "A button that switches the TV to normal TV (Live TV). The TV does not list it as a source, so the card adds it."],
  hdmi_inputs: ["HDMI inputs", "Number of HDMI tiles (HDMI 1..N). The TV only lists the input that is active, so these are always added; the name the TV gives an input (e.g. ATV) is learned when you switch to it. 0 = none."],
  inputs: ["Extra inputs", "Inputs the TV does not list as a source (AV, component, USB ...). Pick one by name, or switch on \"Add the current input\" below while the TV is on it."],
  source_colors: ["Colour the source tiles", "On: brand colour for known services, a stable own colour for every other source. Off: neutral tiles."],
  source_rows: ["Source rows", "How many rows of source tiles to show (they scroll sideways when there are more). 0 = show all of them, wrapped."],
  source_icons: ["Source icons", "Give a source (by name) its own icon and/or colour. Overrides the built-in recognition."],
  haptics: ["Haptics", "Vibrate on taps (HA app haptics or the browser vibration)."],
  side_padding: ["Side margin (px)", "Space at the card's left and right edge; 0 = edge to edge."],
  hide_sources: ["Sources to hide", "Leave these sources out (when no tiles are picked above)."],
  top_padding: ["Top margin (px)", "Space above the first row; 0 = none."],
  bottom_padding: ["Bottom margin (px)", "Space below the last row of buttons; 0 = none."],
  screen_corners: ["Follow the screen's corners", "On a phone with rounded screen corners (iOS), when the bottom button row sits in the bottom corners of the screen (a pop-up), its outer buttons follow the screen's curve."],
  screen_radius: ["Screen corner radius (px)", "Usually leave empty: the card knows the iPhone screen sizes, and the cogwheel sets it for the phone you use. One number = for every screen; or per screen size, for example 402x874: 62."],
  settings_button: ["Settings button", "A cogwheel on the touchpad with quick settings: pointer, motion and swipe speed, haptics, tile rows, which tiles show and their order. Changes are saved in these options (administrators only)."],
  show_border: ["Card border", "Show the border and shadow around the card. Turn it off when the card sits inside a pop-up or stack that has its own frame."],
  pointer_speed: ["Touch pointer speed", "1 = default, lower = slower and more precise, higher = faster."],
  pointer_invert_x: ["Invert left / right", "Flip the horizontal direction of the touch pointer."],
  pointer_invert_y: ["Invert up / down", "Flip the vertical direction of the touch pointer."],
  air_speed: ["Motion pointer speed", "1 = default. Lower if the cursor overshoots, higher if you have to turn the phone too far."],
  air_deadzone: ["Dead zone (deg/s)", "Rotation slower than this is ignored (hand tremor). Raise it if the cursor drifts while you hold still."],
  air_invert_x: ["Invert left / right", "Flip the horizontal direction of the motion pointer."],
  air_invert_y: ["Invert up / down", "Flip the vertical direction of the motion pointer."],
  air_swap_axes: ["Swap turn and tilt", "Use when turning the phone moves the cursor up/down instead of left/right (different way of holding the phone)."],
  swipe_step: ["Swipe distance per key press (px)", "Arrow mode (pointer off): how far you drag for one arrow key. Lower = more sensitive."],
  side_port: ["Side channel port", "Must match the port set in the integration options (0 = never use the side channel)."],
};
class WebosTouchpadEditor extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._render(); }
  set hass(h) {
    this._hass = h;
    if (!this._form) return this._render();
    this._form.hass = this._formCh.hass = this._formB.hass = h;
    this._loadSrv();
    const sig = JSON.stringify(this._tileNames());   // the TV's source list can arrive after setConfig: refresh the tile picker then
    if (sig !== this._sig) { this._sig = sig; this._setSchemas(); }
  }
  async _startScan() {
    const ent = this._c.entity, call = action => this._hass.connection.sendMessagePromise({ type: "webos_pointer/scan", entity_id: ent, action });
    try { this._scan = await call("start"); } catch (e) { this._scan = { error: this._scanErr(e) }; }
    this._scanHelper();
    clearInterval(this._scanT);
    this._scanT = setInterval(async () => {
      try { this._scan = await call("status"); } catch (e) { this._scan = { running: false, error: this._scanErr(e) }; }
      this._scanHelper();
      if (!this._scan.running) { clearInterval(this._scanT); this._srvFor = null; this._loadSrv(); }   // reload the list that the scan filled
    }, 2000);
  }
  // Channel list editor in the style of HA's own list field (drag handle, pencil), but with a hide button instead of the delete button:
  // channels are never deleted one by one, hidden ones are greyed out.
  _listUi() {
    const box = document.createElement("div"); box.style.cssText = "margin:16px 4px 8px;display:flex;flex-direction:column;gap:8px";
    const head = document.createElement("div"); head.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px";
    const title = document.createElement("div"); title.textContent = "Channel list"; title.style.cssText = "font-weight:500";
    const selBtn = document.createElement(customElements.get("ha-button") ? "ha-button" : "button"); selBtn.textContent = "Select";
    if (selBtn.tagName === "BUTTON") selBtn.style.cssText = "padding:6px 12px;border-radius:8px;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit";
    selBtn.addEventListener("click", () => { this._selMode = !this._selMode; if (!this._selMode) { this._sel = new Set(); this._lFilter.value = ""; } this._renderList(); });
    this._lSelBtn = selBtn; selBtn.title = "Select several channels to hide or show them at once"; head.append(title, selBtn);
    // selection toolbar (only while selecting): filter, select shown / none, hide / show the selection
    this._sel = new Set(); this._selMode = false;
    const bar = document.createElement("div"); bar.style.cssText = "display:none;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--divider-color);border-radius:10px"; this._lBar = bar;
    this._lFilter = document.createElement("input"); this._lFilter.type = "search"; this._lFilter.placeholder = "Filter: a name, or a range like 800-999";
    this._lFilter.style.cssText = "padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;min-width:0;box-sizing:border-box;width:100%";
    this._lFilter.addEventListener("input", () => this._applyFilter());
    const mk = (label, fn) => { const b = document.createElement("button"); b.textContent = label; b.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit;font-size:13px"; b.addEventListener("click", fn); return b; };
    const row1 = document.createElement("div"); row1.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
    row1.append(mk("Select shown", () => { this._visibleRows().forEach(r => this._sel.add(r._ch)); this._renderList(); }), mk("Select none", () => { this._sel = new Set(); this._renderList(); }),
      mk("Hide selected", () => this._bulk(false)), mk("Show selected", () => this._bulk(true)));
    this._lCount = document.createElement("div"); this._lCount.style.cssText = "font-size:12px;opacity:.7";
    const hint = document.createElement("div"); hint.style.cssText = "font-size:12px;opacity:.75;line-height:1.4";
    hint.innerHTML = "<b>How to select</b><br>• Tap a row to tick it.<br>• <b>Press a checkbox and drag up or down</b> to tick a whole stretch at once. Starting on a ticked row unticks the stretch instead.<br>• Shift-click ticks everything from the last ticked row.<br>• Filter by name or by number range (for example <i>800-999</i>), then <b>Select shown</b> ticks everything that is shown.<br>• Then press <b>Hide selected</b> or <b>Show selected</b>.";
    bar.append(hint, this._lFilter, row1, this._lCount);
    const help = document.createElement("div"); help.textContent = "Your channels for this TV, stored in Home Assistant and shared by all devices. Drag to reorder, pencil to rename or renumber, eye to hide a channel (it stays in the list, greyed out). Select hides or shows many channels at once. Fill the list with Scan now."; help.style.cssText = "font-size:12px;opacity:.7";
    this._lRows = document.createElement("div"); this._lRows.style.cssText = "display:flex;flex-direction:column;gap:4px";
    this._lDl = document.createElement("datalist"); this._lDl.id = "webos-tv-channels-" + Math.random().toString(36).slice(2);
    const add = document.createElement(customElements.get("ha-button") ? "ha-button" : "button"); add.textContent = "Add a channel";
    if (add.tagName === "BUTTON") add.style.cssText = "padding:8px 14px;border-radius:8px;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit;align-self:flex-start";
    add.addEventListener("click", () => { if (!this._srvE) return; this._srvE.list.push({ name: "", number: "", enabled: true, manual: true, _edit: true }); this._renderList(); const r = this._lRows.lastElementChild; if (r) { r.scrollIntoView({ block: "nearest" }); const i = r.querySelector("input"); if (i) i.focus(); } });
    box.append(head, help, bar, this._lRows, this._lDl, add);
    return box;
  }
  _matches(ch, q) {   // filter: text in name/number, or a number range like 800-999
    q = (q || "").trim().toLowerCase(); if (!q) return true;
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(q);
    if (m) { const n = parseFloat(String(ch.number || "").replace(",", ".")); return Number.isFinite(n) && n >= +m[1] && n <= +m[2]; }
    return ((ch.name || "") + " " + (ch.number || "")).toLowerCase().includes(q);
  }
  _buzz() { try { window.dispatchEvent(new CustomEvent("haptic", { detail: "light" })); } catch (e) {} try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }
  _scrollParent(el) { for (let n = el.parentElement || (el.getRootNode() && el.getRootNode().host); n; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) return n; } return document.scrollingElement; }
  _visibleRows() { return [...this._lRows.children].filter(r => r._ch && r.style.display !== "none"); }
  _applyFilter() { [...this._lRows.children].forEach(r => { if (r._ch) r.style.display = this._matches(r._ch, this._lFilter.value) ? "flex" : "none"; }); this._selInfo(); }
  _selInfo() { if (this._lCount) this._lCount.textContent = this._sel.size + " selected, " + this._visibleRows().length + " shown"; }
  _bulk(show) {   // hide or show every selected channel at once
    if (!this._sel.size) return;
    this._sel.forEach(ch => { ch.enabled = show; }); this._sel = new Set();   // the selection is used up
    this._saveChannels(this._srvE.list.filter(x => x.name && x.name.trim())); this._renderList();
  }
  _renderList() {
    if (!this._lRows) return;
    const rows = this._lRows; rows.textContent = ""; this._lDl.textContent = "";
    this._lBar.style.display = this._selMode ? "flex" : "none"; this._lSelBtn.textContent = this._selMode ? "Done" : "Select";
    if (!this._srvE) { const d = document.createElement("div"); d.textContent = "The channel list is not available (restart Home Assistant after updating the integration)."; d.style.cssText = "font-size:13px;opacity:.7"; rows.appendChild(d); return; }
    ((this._srvE.tv) || []).forEach(c => { const o = document.createElement("option"); o.value = c.name; this._lDl.appendChild(o); });
    const list = this._srvE.list, save = () => this._saveChannels(list.filter(x => x.name && x.name.trim()));
    const inputCss = "padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;min-width:0;box-sizing:border-box";
    const iconBtn = (icon, title, fn) => { const b = document.createElement("button"); const ic = document.createElement("ha-icon"); ic.setAttribute("icon", icon); ic.style.setProperty("--mdc-icon-size", "20px"); b.appendChild(ic); b.title = title; b.style.cssText = "flex:none;width:30px;height:30px;border:0;background:none;color:var(--secondary-text-color);cursor:pointer;padding:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center"; if (fn) b.addEventListener("click", fn); return b; };
    list.forEach(ch => {
      const row = document.createElement("div"); row._ch = ch; row.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:0 6px;border:1px solid var(--divider-color);border-radius:10px;min-height:34px;background:var(--card-background-color);box-sizing:border-box;transition:opacity .15s";
      if (ch.enabled === false) row.style.opacity = ".4";
      let handle;
      if (this._selMode) {   // selecting: a checkbox instead of the drag handle. Tap a row to tick it, DRAG down/up over the checkboxes to tick (or untick) a whole stretch, shift-click for a range
        const cell = document.createElement("div"); cell.style.cssText = "flex:none;width:46px;height:34px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:pointer";
        const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = this._sel.has(ch); cb.style.cssText = "width:20px;height:20px;margin:0;pointer-events:none;accent-color:var(--primary-color)";
        cell.appendChild(cb); handle = cell; row._cb = cb;
        const setRow = (r, on) => { if (!r._ch) return; if (on) this._sel.add(r._ch); else this._sel.delete(r._ch); if (r._cb) r._cb.checked = on; };
        const vis = () => this._visibleRows();
        let paint = null;
        cell.addEventListener("pointerdown", e => {
          e.preventDefault(); try { cell.setPointerCapture(e.pointerId); } catch (err) {}
          const list2 = vis(), start = list2.indexOf(row), on = !this._sel.has(ch);
          if (e.shiftKey && this._anchor && list2.includes(this._anchor)) {   // shift: everything between the last ticked row and this one
            const a1 = list2.indexOf(this._anchor), lo = Math.min(a1, start), hi = Math.max(a1, start); for (let i = lo; i <= hi; i++) setRow(list2[i], true); this._selInfo(); return;
          }
          paint = { start, on, orig: new Map(list2.map(r => [r, this._sel.has(r._ch)])), list: list2 }; setRow(row, on); this._anchor = row; this._selInfo();
        });
        cell.addEventListener("pointermove", e => {
          if (!paint) return;
          const L = paint.list; let cur = L.findIndex(r => { const bb = r.getBoundingClientRect(); return e.clientY >= bb.top && e.clientY < bb.bottom; });
          if (cur < 0) cur = e.clientY < L[0].getBoundingClientRect().top ? 0 : L.length - 1;
          const lo = Math.min(paint.start, cur), hi = Math.max(paint.start, cur);
          L.forEach((r, i) => setRow(r, i >= lo && i <= hi ? paint.on : paint.orig.get(r)));
          this._selInfo();
          const sp = this._scrollParent(rows), edge = 70;   // near the top/bottom edge: scroll along
          if (sp) { const rb = sp === document.scrollingElement ? { top: 0, bottom: innerHeight } : sp.getBoundingClientRect(); if (e.clientY > rb.bottom - edge) sp.scrollTop += 18; else if (e.clientY < rb.top + edge) sp.scrollTop -= 18; }
        });
        const end = () => { paint = null; };
        cell.addEventListener("pointerup", end); cell.addEventListener("pointercancel", end);
        row.addEventListener("click", ev => { if (ev.target.closest("button, input, [data-cell]") || cell.contains(ev.target)) return; setRow(row, !this._sel.has(ch)); this._anchor = row; this._selInfo(); });
        row.style.cursor = "pointer";
      } else { handle = iconBtn("mdi:drag-horizontal-variant", "Drag to reorder"); handle.style.cursor = "grab"; handle.style.touchAction = "none"; }
      const text = document.createElement("div"); text.style.cssText = "flex:1;min-width:0;display:flex;align-items:baseline;gap:10px;overflow:hidden;white-space:nowrap";   // one line: number, then the name
      const sub = document.createElement("span"); sub.textContent = ch.number || ""; sub.style.cssText = "flex:none;min-width:34px;text-align:right;font-weight:600;font-size:15px;opacity:.65;font-variant-numeric:tabular-nums";
      const nm = document.createElement("span"); nm.textContent = ch.name || "New channel"; nm.style.cssText = "font-size:15px;overflow:hidden;text-overflow:ellipsis";
      text.append(sub, nm);
      const edit = iconBtn("mdi:pencil", "Edit name and number", () => { ch._edit = !ch._edit; this._renderList(); });
      const hide = iconBtn(ch.enabled === false ? "mdi:eye-off" : "mdi:eye", ch.enabled === false ? "Hidden: show on the card" : "Hide on the card", () => { ch.enabled = ch.enabled === false; save(); this._renderList(); });
      row.append(handle, text, edit, hide);
      if (ch.manual) {   // channels you added by hand can be deleted; scanned ones can only be hidden
        const del = iconBtn("mdi:delete", "Delete this channel (added by hand)", () => { const i = list.indexOf(ch); if (i >= 0) list.splice(i, 1); save(); this._renderList(); });
        row.appendChild(del);
      }
      if (ch._edit) {
        const panel = document.createElement("div"); panel.style.cssText = "flex:0 0 100%;display:flex;gap:8px;padding:4px 4px 6px";
        const name = document.createElement("input"); name.value = ch.name || ""; name.placeholder = "Channel name"; name.setAttribute("list", this._lDl.id); name.style.cssText = inputCss + ";flex:1";
        const num = document.createElement("input"); num.value = ch.number || ""; num.placeholder = "Number"; num.inputMode = "numeric"; num.style.cssText = inputCss + ";width:90px;flex:none";
        name.addEventListener("input", () => { ch.name = name.value; nm.textContent = ch.name || "New channel"; const m = ((this._srvE.tv) || []).find(c => c.name === ch.name); if (m && !ch.number) { ch.number = m.number || ""; num.value = ch.number; sub.textContent = ch.number; } save(); });
        num.addEventListener("input", () => { ch.number = num.value.trim(); sub.textContent = ch.number; save(); });
        panel.append(name, num); row.appendChild(panel);
      }
      if (!this._selMode) {   // drag by the handle: the row lifts (scale + shadow), follows the finger and the others flow out of its way; it settles into its slot on release
        const EASE = "cubic-bezier(.2,.8,.2,1)", GAP = 4;
        let st = null;
        const place = () => {   // the lifted row follows the pointer; the rows it has passed flow aside by its height
          if (!st) return;
          const dy = st.y - st.y0 + (st.scroller ? st.scroller.scrollTop - st.s0 : 0);
          if (!st.moved && Math.abs(dy) > 2) { st.moved = true; row.style.transition = "box-shadow .18s"; }
          row.style.transform = "translateY(" + dy + "px) scale(1.03)";
          const dc = st.c[st.i] + dy; let to = st.i;
          if (dy > 0) { for (let k = st.i + 1; k < st.c.length; k++) if (st.c[k] <= dc) to = k; } else { for (let k = st.i - 1; k >= 0; k--) if (st.c[k] >= dc) to = k; }
          if (to === st.to) return;
          st.to = to; this._buzz();
          st.els.forEach((x, k) => { if (x === row) return; const sh = to > st.i && k > st.i && k <= to ? -(st.h[st.i] + GAP) : to < st.i && k >= to && k < st.i ? st.h[st.i] + GAP : 0; x.style.transform = sh ? "translateY(" + sh + "px)" : ""; });
        };
        handle.addEventListener("pointerdown", e => {
          e.preventDefault(); try { handle.setPointerCapture(e.pointerId); } catch (err) {}
          const els = [...rows.children].filter(x => x._ch), scroller = this._scrollParent(rows);
          st = { els, i: els.indexOf(row), y0: e.clientY, y: e.clientY, scroller, s0: scroller ? scroller.scrollTop : 0, moved: false, h: els.map(x => x.offsetHeight), c: els.map(x => x.offsetTop + x.offsetHeight / 2) };
          st.to = st.i;
          els.forEach(x => { if (x !== row) x.style.transition = "transform .22s " + EASE; });
          row.style.cssText += ";position:relative;z-index:3;cursor:grabbing;box-shadow:0 10px 28px rgba(0,0,0,.5);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))";
          row.style.transition = "transform .18s " + EASE + ", box-shadow .18s"; row.style.transform = "scale(1.03)";   // pops up on grab
          this._buzz();
          st.timer = setInterval(() => {   // near the top / bottom edge the list scrolls along
            if (!st.scroller) return;
            const rb = st.scroller === document.scrollingElement ? { top: 0, bottom: innerHeight } : st.scroller.getBoundingClientRect();
            if (st.y > rb.bottom - 70) st.scroller.scrollTop += 12; else if (st.y < rb.top + 70) st.scroller.scrollTop -= 12; else return;
            place();
          }, 16);
        });
        handle.addEventListener("pointermove", e => { if (st) { st.y = e.clientY; place(); } });
        const drop = () => {
          if (!st) return; const s = st; st = null; clearInterval(s.timer);
          let off = 0; if (s.to > s.i) for (let k = s.i + 1; k <= s.to; k++) off += s.h[k] + GAP; else for (let k = s.to; k < s.i; k++) off -= s.h[k] + GAP;
          row.style.transition = "transform .22s " + EASE + ", box-shadow .22s"; row.style.boxShadow = "0 0 0 transparent";
          row.style.transform = "translateY(" + off + "px) scale(1)";   // settles into its slot
          setTimeout(() => { if (s.to !== s.i) { const [it] = list.splice(s.i, 1); list.splice(s.to, 0, it); save(); this._renderList(); } else this._renderList(); }, 240);
        };
        handle.addEventListener("pointerup", drop); handle.addEventListener("pointercancel", drop);
      }
      rows.appendChild(row);
    });
    if (this._selMode) this._applyFilter();
    if (!list.length) { const d = document.createElement("div"); d.textContent = "No channels yet. Press Scan now."; d.style.cssText = "font-size:13px;opacity:.7"; rows.appendChild(d); }
  }
  _scanErr(e) {   // an old integration version does not know the scan command until Home Assistant has been restarted
    if (e && (e.code === "unknown_command" || /unknown/i.test(String(e.message || "")))) return "the integration has not been updated yet. Restart Home Assistant (Settings > System > Restart) and try again";
    return (e && e.message) ? String(e.message) : "no answer from Home Assistant";
  }
  _scanHelper() {   // progress text next to the buttons
    const sc = this._scan || {};
    this._toolsMsg(sc.running ? "Scanning... " + (sc.found || 0) + " new channel(s) found so far" : sc.error ? "Scan stopped: " + sc.error : sc.found !== undefined ? "Scan finished: " + sc.found + " new channel(s) added" : "");
  }
  _toolsMsg(t) { if (this._status) this._status.textContent = t || ""; }
  _tools(part) {   // real buttons for one-off actions (a form can only offer switches); part "channels" or "inputs"
    const box = document.createElement("div"); box.style.cssText = "margin:16px 4px 8px;display:flex;flex-direction:column;gap:8px";
    const h = (t) => { const d = document.createElement("div"); d.textContent = t; d.style.cssText = "font-weight:500;margin-top:4px"; return d; };
    const row = document.createElement("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
    const btn = (label, fn, icon) => {
      const b = customElements.get("ha-button") ? document.createElement("ha-button") : document.createElement("button");
      b.textContent = label; b.title = label;
      if (b.tagName === "BUTTON") b.style.cssText = "padding:8px 14px;border-radius:8px;border:1px solid var(--divider-color);background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit";
      b.addEventListener("click", fn); return b;
    };
    row.append(btn("Scan now", () => this._doScan()), btn("Sort by number", () => this._doSort()), btn("Clear list", () => this._doClear()));
    const row2 = document.createElement("div"); row2.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
    row2.append(btn("Add the current input", () => this._doAddInput()));
    const note = (t) => { const d = document.createElement("div"); d.textContent = t; d.style.cssText = "font-size:12px;opacity:.7"; return d; };
    this._status = document.createElement("div"); this._status.style.cssText = "font-size:13px;min-height:18px;color:var(--primary-color)";
    if (part === "channels") box.append(h("Channel list tools"), row, this._status,
      note("Scan: reads the TV's channel list, or zaps through all channels from channel 1 and returns to the one you were watching (TV must be on). Sort: orders the list by channel number once. Clear: deletes all channels of this TV."));
    else box.append(h("Inputs"), row2, note("Put the TV on the input first (with the real remote), then add it. Not needed for HDMI inputs and Live TV."));
    return box;
  }
  _tvOn() { const st = this._hass && this._hass.states[this._c.entity]; return !!st && !["off", "unavailable", "unknown"].includes(st.state); }
  _doScan() {
    if (!this._tvOn()) return this._toolsMsg("The TV is off. Turn it on and try again.");   // no point in asking: a scan needs the TV on
    if (window.confirm("Scan all channels now? If the TV has no channel list it zaps through every channel once (about a second each), starting at channel 1, and then returns to the channel you were watching.")) this._startScan();
  }
  _doSort() {
    if (!window.confirm("Sort the channel list by channel number? Your current order is replaced.")) return;
    this._hass.connection.sendMessagePromise({ type: "webos_pointer/sort_channels", entity_id: this._c.entity })
      .then(r => { this._srvE = { ...(this._srvE || { tv: [] }), list: r.list || [] }; this._srvSig = JSON.stringify([this._srvE.list.map(x => ({ name: x.name, number: x.number || "", enabled: x.enabled !== false }))]); this._render(); this._toolsMsg("Sorted by channel number"); })
      .catch(err => this._toolsMsg("Sort failed: " + this._scanErr(err)));
  }
  _doClear() {
    if (!window.confirm("Delete all channels of this TV and start over?")) return;
    this._srvE = { ...(this._srvE || { tv: [] }), list: [] }; this._srvSig = JSON.stringify([[]]); this._render();
    this._hass.connection.sendMessagePromise({ type: "webos_pointer/set_channels", entity_id: this._c.entity, list: [] }).then(() => this._toolsMsg("Channel list cleared")).catch(err => this._toolsMsg("Clear failed: " + this._scanErr(err)));
  }
  _doAddInput() {
    const before = Array.isArray(this._c.inputs) ? this._c.inputs : [], after = this._addCurrentInput(before);
    if (after === before || after.length === before.length) return this._toolsMsg("Nothing added: HDMI inputs and Live TV are built in, and this input is already in the list (or the TV shows no input).");
    this._c = { ...this._c, inputs: after }; this._render();
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._c }, bubbles: true, composed: true }));
    this._toolsMsg("Added: " + after[after.length - 1].name);
  }
  async _loadSrv() {   // your channel list lives on the server
    const ent = this._c && this._c.entity; if (!ent || !this._hass || this._srvFor === ent) return; this._srvFor = ent;
    try { this._srvE = await fetchChannels(this._hass, ent); this._srvSig = JSON.stringify([this._srvE.list]); this._setSchemas(); this._render(); } catch (e) { this._srvE = null; }
  }
  _saveChannels(list) {
    if (!this._srvE || list === undefined) return;
    const clean = list.map(x => ({ name: String(x.name || "").trim(), number: x.number === undefined || x.number === null || x.number === "" ? "" : String(x.number), enabled: x.enabled !== false, manual: !!x.manual })).filter(x => x.name);
    const sig = JSON.stringify([clean]); if (sig === this._srvSig) return;
    this._srvSig = sig;   // (this._srvE.list is the model the list editor works on)
    clearTimeout(this._svT);
    this._svT = setTimeout(() => { try { this._hass.connection.sendMessagePromise({ type: "webos_pointer/set_channels", entity_id: this._c.entity, list: clean }); } catch (e) {} }, 500);
  }
  _inputOptions() {   // typical inputs by name, plus the input the TV is on right now (so a custom one can be picked as well)
    const opts = KNOWN_INPUTS.map(k => ({ value: k.id, label: k.name }));
    const st = this._hass && this._c && this._hass.states[this._c.entity], id = st && st.attributes.app_id;
    if (id && !opts.some(o => o.value === id) && !/com\.webos\.app\.(hdmi\d|livetv)$/.test(id)) opts.unshift({ value: id, label: (st.attributes.source ? st.attributes.source + " - " : "") + id + " (current)" });
    return opts;
  }
  _addCurrentInput(list) {   // returns the new inputs list (or the old one when the current input is built in / already there)
    const st = this._hass && this._hass.states[this._c.entity], id = st && st.attributes.app_id, cur = Array.isArray(list) ? list : [];
    if (!id || /com\.webos\.app\.(hdmi\d|livetv)$/.test(id) || cur.some(i => i.app_id === id)) return cur;
    const k = knownInput(id);
    return [...cur, { app_id: id, name: (k && k.name.replace(/ \(.*\)$/, "")) || st.attributes.source || id, ...(k ? { icon: k.icon } : {}) }];
  }
  _tileNames() {   // what the strip would show right now (for the order picker)
    try {
      const st = this._hass && this._hass.states[this._c.entity];
      const c = { ...DEFAULTS, ...this._c, source_order: [] };
      return buildItems(c, st, learnedNames(c, k => { try { return localStorage.getItem(k); } catch (e) { return null; } })).map(i => ({ value: i.name, label: i.alias && i.alias !== i.name ? i.name + " (" + i.alias + ")" : i.name }));   // learned input names show their HDMI number: ATV (HDMI 1)
    } catch (e) { return []; }
  }
  _schema() {
    const tvNames = ((this._srvE && this._srvE.tv) || []).map(c => c.name).filter((n, i, a) => a.indexOf(n) === i).slice(0, 400);
    const list = (name, label, desc, fields) => ({ name, selector: { object: { multiple: true, label_field: label, description_field: desc, fields } } });
    return [
      { name: "entity", required: true, selector: { entity: { filter: [{ integration: "webostv", domain: "media_player" }] } } },
      { name: "height", selector: { text: {} } },
      { name: "pad_ratio", selector: { number: { min: 0.8, max: 2.5, step: 0.05, mode: "slider" } } },
      { name: "pad_extra", selector: { number: { min: 0, max: 120, step: 1, mode: "slider", unit_of_measurement: "px" } } },
      { name: "side_padding", selector: { number: { min: 0, max: 24, step: 1, mode: "slider", unit_of_measurement: "px" } } },
      { name: "top_padding", selector: { number: { min: 0, max: 24, step: 1, mode: "slider", unit_of_measurement: "px" } } },
      { name: "bottom_padding", selector: { number: { min: 0, max: 24, step: 1, mode: "slider", unit_of_measurement: "px" } } },
      { name: "screen_corners", selector: { boolean: {} } },
      { name: "screen_radius", selector: { object: {} } },
      { name: "", type: "grid", schema: [{ name: "pointer", selector: { boolean: {} } }, { name: "air_pointer", selector: { boolean: {} } },
                                         { name: "sources", selector: { boolean: {} } }, { name: "haptics", selector: { boolean: {} } }, { name: "show_border", selector: { boolean: {} } }, { name: "settings_button", selector: { boolean: {} } }] },
      { type: "expandable", title: "Channels (Live TV)", icon: "mdi:television-guide", schema: [
        { name: "tv_controls", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Auto (only on Live TV)" }, { value: "always", label: "Always" }, { value: "never", label: "Never" }] } } },
        { name: "channel_sort", selector: { select: { mode: "dropdown", options: [{ value: "manual", label: "Order of the list (default)" }, { value: "number", label: "Always show sorted by channel number" }] } } },
        { name: "keypad", selector: { boolean: {} } },
        { name: "live_tv", selector: { boolean: {} } }] },
      { type: "expandable", title: "Inputs and sources", icon: "mdi:video-input-hdmi", schema: [
        { name: "source_order", selector: { select: { multiple: true, reorder: true, custom_value: true, mode: "dropdown", options: this._tileNames() } } },
        { name: "hide_sources", selector: { select: { multiple: true, custom_value: true, mode: "dropdown", options: this._tileNames() } } },
        { name: "hdmi_inputs", selector: { number: { min: 0, max: 8, step: 1, mode: "slider" } } },
        { name: "source_style", selector: { select: { mode: "dropdown", options: [{ value: "tiles", label: "Tiles (icon + name)" }, { value: "chips", label: "Chips (name only)" }] } } },
        { name: "source_rows", selector: { number: { min: 0, max: 6, step: 1, mode: "slider" } } },
        { name: "source_colors", selector: { boolean: {} } },
        list("inputs", "name", "app_id", {
          app_id: { required: true, selector: { select: { mode: "dropdown", custom_value: true, options: this._inputOptions() } } },
          name: { selector: { text: {} } }, icon: { selector: { icon: {} } } }),
        list("source_icons", "name", "icon", {
          name: { required: true, selector: { text: {} } }, icon: { selector: { icon: {} } }, color: { selector: { text: {} } } })] },
      { type: "expandable", title: "Touch pointer", icon: "mdi:cursor-default", schema: [
        { name: "pointer_speed", selector: num(0.2, 4, 0.1) },
        { name: "", type: "grid", schema: [{ name: "pointer_invert_x", selector: { boolean: {} } }, { name: "pointer_invert_y", selector: { boolean: {} } }] }] },
      { type: "expandable", title: "Motion (air) pointer", icon: "mdi:cellphone-wireless", schema: [
        { name: "air_speed", selector: num(0.2, 4, 0.1) },
        { name: "air_deadzone", selector: num(0, 10, 0.5) },
        { name: "", type: "grid", schema: [{ name: "air_invert_x", selector: { boolean: {} } }, { name: "air_invert_y", selector: { boolean: {} } }] },
        { name: "air_swap_axes", selector: { boolean: {} } }] },
      { type: "expandable", title: "Arrow mode and connection", icon: "mdi:tune", schema: [
        { name: "swipe_step", selector: num(15, 120, 1) },
        { name: "side_port", selector: { number: { min: 0, max: 65535, step: 1, mode: "box" } } }] },
    ];
  }
  _schemas() {   // the editor is three forms with our own "Channels (Live TV)" dropdown in between (it also holds the channel list)
    const all = this._schema(), i = all.findIndex(x => x.title === "Channels (Live TV)");
    return { a: all.slice(0, i), ch: all[i].schema, b: all.slice(i + 1) };
  }
  _setSchemas() { const sc = this._schemas(); this._form.schema = sc.a; this._formCh.schema = sc.ch; this._formB.schema = sc.b; }
  _mkForm(onChange) {
    const f = document.createElement("ha-form");
    f.computeLabel = s => (LABELS[s.name] || [FIELD_LABELS[s.name] || s.title || s.name])[0];
    f.computeHelper = s => (LABELS[s.name] || [])[1] || "";
    f.addEventListener("value-changed", onChange); return f;
  }
  _panel(title, icon) {   // like the expandable sections of ha-form
    let panel;
    if (customElements.get("ha-expansion-panel")) {
      panel = document.createElement("ha-expansion-panel"); panel.header = title; panel.outlined = true; panel.setAttribute("outlined", ""); panel.leftChevron = true;
      const ic = document.createElement("ha-icon"); ic.setAttribute("slot", "icons"); ic.setAttribute("icon", icon); panel.appendChild(ic);
    } else { panel = document.createElement("details"); const sm = document.createElement("summary"); sm.textContent = title; sm.style.cssText = "cursor:pointer;padding:12px 4px;font-weight:500"; panel.appendChild(sm); }
    panel.style.cssText = "display:block;margin:8px 0";
    return panel;
  }
  _render() {
    if (!this._c) return;
    if (!this._form) {
      const onChange = e => {
        e.stopPropagation();
        const v = { ...e.detail.value }, out = { type: this._c.type || "custom:webos-touchpad" };
        Object.keys(v).forEach(k => { if (v[k] !== undefined && v[k] !== "" && !(k in DEFAULTS && v[k] === DEFAULTS[k] && !(k in this._c))) out[k] = v[k]; });   // keep the YAML short: untouched defaults are not written
        if (Array.isArray(out.channels) && !out.channels.length) delete out.channels;   // the list editor normalises this; keep the YAML clean
        this._c = out;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: out }, bubbles: true, composed: true }));
      };
      this._form = this._mkForm(onChange); this._formCh = this._mkForm(onChange); this._formB = this._mkForm(onChange);
      this._setSchemas();
      const panel = this._panel("Channels (Live TV)", "mdi:television-guide"), inner = document.createElement("div"); inner.style.cssText = "padding:4px 8px 8px";
      inner.append(this._formCh, this._listUi(), this._tools("channels")); panel.appendChild(inner);
      this.append(this._form, panel, this._formB, this._tools("inputs"));
    }
    this._renderList();
    if (this._hass) { this._form.hass = this._formCh.hass = this._formB.hass = this._hass; this._loadSrv(); }
    this._sig = JSON.stringify(this._tileNames());
    this._setSchemas();
    const d = { ...DEFAULTS, ...this._c };
    d.channels = (Array.isArray(d.channels) ? d.channels : []).map(x => typeof x === "object" && x ? x : { name: String(x) });   // plain names -> objects for the list editor
    if (d.source_icons && !Array.isArray(d.source_icons)) d.source_icons = Object.entries(d.source_icons).map(([name, v]) => typeof v === "string" ? { name, icon: v } : { name, ...v });
 if (!Array.isArray(d.inputs)) d.inputs = [];
    this._form.data = this._formCh.data = this._formB.data = d;
  }
}
if (!customElements.get("webos-touchpad-editor")) customElements.define("webos-touchpad-editor", WebosTouchpadEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "webos-touchpad", name: "LG webOS remote", description: "Touchpad, Magic Remote pointer and phone-motion pointer for an LG webOS TV" });
