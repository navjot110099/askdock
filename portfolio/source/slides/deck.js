/*
 * Builds the shared slide chrome and mockups, and places numbered markers on
 * screenshots using the element boxes recorded by capture.ts (anchors.js).
 *
 *   <div class="browser" data-shot="d-hero" data-url="askdock.vercel.app" style="left;top;width">
 *     <span class="mk" data-a="pill" data-at="l" data-dx="-24">1</span>
 *   </div>
 *   <div class="phone" data-shot="m-hero" style="left;top;width"></div>
 *   <div class="crop" data-shot="d-hero" data-region="x,y,w,h" style="width"></div>
 *
 * data-at picks the point on the anchor box (l, r, t, b, c, tl, tr, bl, br);
 * data-xy="x,y" places a marker at explicit screenshot (CSS px) coordinates.
 */
(function () {
  const A = window.ANCHORS || {};
  const SHOTS = "../shots/";
  const TOTAL = 10;
  const errors = [];

  const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a6c"/><stop offset=".4" stop-color="#ee5f92"/><stop offset=".75" stop-color="#8f67ee"/><stop offset="1" stop-color="#3fb5c2"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#18131f"/><path d="M16 18h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H31l-9 7v-7h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="url(#lg)"/><path d="M22 35c3 3.2 6.4 4.8 10 4.8S39 38.2 42 35" fill="none" stroke="#18131f" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  const ICONS = `<span class="icons"><svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".8"/><rect x="5" y="5" width="3" height="6" rx=".8"/><rect x="10" y="2.5" width="3" height="8.5" rx=".8"/><rect x="15" y="0" width="3" height="11" rx=".8"/></svg><svg viewBox="0 0 16 11"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.4 8.4 0 0 1 6-2.4zm0 3.5c1.3 0 2.5.5 3.5 1.3l1.2-1.3A6.8 6.8 0 0 0 8 3.9c-1.8 0-3.4.7-4.7 1.8L4.5 7c1-.8 2.2-1.3 3.5-1.3zM8 9.2l2.3-2.4A3.4 3.4 0 0 0 8 7.4c-.9 0-1.7.3-2.3.9z"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="2"/><path d="M24 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" opacity=".45"/></svg></span>`;

  // Chrome ----------------------------------------------------------------------
  const top = document.querySelector(".top");
  if (top) {
    const n = String(top.dataset.n).padStart(2, "0");
    top.innerHTML = `<div class="brand">${LOGO}<span class="word">Ask<i>Dock</i></span></div><div class="label">${top.dataset.label}</div><div class="num"><b>${n}</b> / ${TOTAL}</div>`;
  }

  // Mockups ---------------------------------------------------------------------
  function buildScreen(host, shot) {
    const screen = document.createElement("div");
    screen.className = "screen";
    screen.dataset.shot = shot;
    if (host.dataset.view) screen.dataset.view = host.dataset.view;
    [...host.querySelectorAll(":scope > .mk")].forEach((mk) => screen.appendChild(mk));
    return screen;
  }

  document.querySelectorAll(".browser[data-shot]").forEach((b) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `<i></i><i></i><i></i><span class="url">${b.dataset.url || "askdock.vercel.app"}</span><span class="sp"></span>`;
    const screen = buildScreen(b, b.dataset.shot);
    b.prepend(bar);
    b.appendChild(screen);
  });

  document.querySelectorAll(".phone[data-shot]").forEach((p) => {
    const outer = p.getBoundingClientRect().width;
    const s = (outer - 22) / 390;
    const glass = document.createElement("div");
    glass.className = "glass";
    if (p.dataset.sb) glass.style.setProperty("--sb", p.dataset.sb);
    if (p.dataset.sbc) glass.style.setProperty("--sbc", p.dataset.sbc);
    const status = document.createElement("div");
    status.className = "status";
    status.style.height = `${Math.round(44 * s)}px`;
    status.style.fontSize = `${(15 * s).toFixed(1)}px`;
    status.style.padding = `0 ${Math.round(30 * s)}px 0 ${Math.round(38 * s)}px`;
    status.innerHTML = `<span>9:41</span>${ICONS}`;
    status.style.setProperty("--island", `${Math.round(96 * s)}px`);
    const screen = buildScreen(p, p.dataset.shot);
    glass.append(status, screen);
    p.appendChild(glass);
    const style = document.createElement("style");
    p.dataset.pid = Math.random().toString(36).slice(2, 8);
    style.textContent = `.phone[data-pid="${p.dataset.pid}"] .status::after{width:${Math.round(100 * s)}px;height:${Math.round(29 * s)}px;top:${Math.round(9 * s)}px}`;
    document.head.appendChild(style);
  });

  function placeMarker(mk, name, meta, vx, vy, vw, vh) {
    let x;
    let y;
    if (mk.dataset.xy) {
      [x, y] = mk.dataset.xy.split(",").map(Number);
    } else {
      const box = meta && meta.a[mk.dataset.a];
      if (!box) {
        errors.push(`${name}: missing anchor ${mk.dataset.a}`);
        mk.style.background = "red";
        return;
      }
      const at = mk.dataset.at || "l";
      x = at.includes("l") ? box.x : at.includes("r") ? box.x + box.w : box.x + box.w / 2;
      y = at.includes("t") ? box.y : at.includes("b") ? box.y + box.h : box.y + box.h / 2;
    }
    mk.style.left = `${((x - vx) / vw) * 100}%`;
    mk.style.top = `${((y - vy) / vh) * 100}%`;
    const dx = Number(mk.dataset.dx || 0);
    const dy = Number(mk.dataset.dy || 0);
    mk.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // Screens + markers -------------------------------------------------------------
  document.querySelectorAll(".screen[data-shot]").forEach((screen) => {
    const name = screen.dataset.shot;
    const meta = A[name];
    if (!meta) errors.push(`no anchors for ${name}`);
    const W = meta ? meta.w : 1440;
    const H = meta ? meta.h : 900;
    const view = screen.dataset.view ? screen.dataset.view.split(",").map(Number) : [0, 0, W, H];
    const [vx, vy, vw, vh] = view;
    const img = new Image();
    img.src = `${SHOTS}${name}.png`;
    img.alt = "";
    screen.prepend(img);
    if (screen.dataset.view) {
      screen.classList.add("view");
      screen.style.aspectRatio = `${vw} / ${vh}`;
      img.style.width = `${(W / vw) * 100}%`;
      img.style.left = `${(-vx / vw) * 100}%`;
      img.style.top = `${(-vy / vh) * 100}%`;
    }
    screen.querySelectorAll(".mk").forEach((mk) => placeMarker(mk, name, meta, vx, vy, vw, vh));
  });

  // Crops -------------------------------------------------------------------------
  document.querySelectorAll(".crop[data-shot]").forEach((c) => {
    const meta = A[c.dataset.shot] || { w: 1440, h: 900, a: {} };
    let x, y, w, h;
    if (c.dataset.span) {
      // Region = union of anchor boxes (+ padding), optionally with a fixed x range.
      const boxes = c.dataset.span.split(",").map((k) => meta.a[k]).filter(Boolean);
      if (boxes.length < c.dataset.span.split(",").length) errors.push(`${c.dataset.shot}: missing span anchor`);
      const [pl, pt, pr, pb] = (c.dataset.pad || "0,0,0,0").split(",").map(Number);
      x = Math.min(...boxes.map((b) => b.x)) - pl;
      y = Math.min(...boxes.map((b) => b.y)) - pt;
      let x2 = Math.max(...boxes.map((b) => b.x + b.w)) + pr;
      const y2 = Math.max(...boxes.map((b) => b.y + b.h)) + pb;
      if (c.dataset.x) [x, x2] = c.dataset.x.split(",").map(Number);
      w = x2 - x;
      h = y2 - y;
    } else {
      [x, y, w, h] = c.dataset.region.split(",").map(Number);
    }
    const width = c.getBoundingClientRect().width;
    const k = width / w;
    c.style.height = `${h * k}px`;
    c.style.backgroundImage = `url(${SHOTS}${c.dataset.shot}.png)`;
    c.style.backgroundSize = `${meta.w * k}px ${meta.h * k}px`;
    c.style.backgroundPosition = `${-x * k}px ${-y * k}px`;
    c.querySelectorAll(".mk").forEach((mk) => placeMarker(mk, c.dataset.shot, A[c.dataset.shot], x, y, w, h));
  });

  // Ready signal for the renderer -----------------------------------------------------
  const urls = [...document.querySelectorAll("img")].map((i) => i.src).concat(
    [...document.querySelectorAll(".crop")].map((c) => c.style.backgroundImage.slice(5, -2)),
  );
  Promise.all([
    document.fonts.ready,
    ...urls.map(
      (u) =>
        new Promise((res) => {
          const i = new Image();
          i.onload = () => i.decode().then(res, res);
          i.onerror = () => {
            errors.push(`image failed: ${u}`);
            res();
          };
          i.src = u;
        }),
    ),
  ]).then(() => {
    window.__errors = errors;
    document.body.dataset.ready = "1";
  });
})();
