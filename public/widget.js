/*!
 * AskDock chat widget — https://askdock.app
 * Usage: <script src="https://YOUR-ASKDOCK-DOMAIN/widget.js" data-bot="BOT_ID" async></script>
 * Optional: data-position="left", data-greeting="off"
 */
(function () {
  "use strict";
  var script =
    document.currentScript || document.querySelector('script[src*="widget.js"][data-bot]');
  if (!script || window.__askdockWidget) return;
  window.__askdockWidget = true;

  var botId = script.getAttribute("data-bot");
  if (!botId) return console.warn("[AskDock] Missing data-bot attribute on the widget script.");
  var origin = new URL(script.src, location.href).origin;
  var side = script.getAttribute("data-position") === "left" ? "left" : "right";
  var showGreeting = script.getAttribute("data-greeting") !== "off";

  fetch(origin + "/api/widget/" + encodeURIComponent(botId))
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (cfg) {
      if (cfg) mount(cfg);
    })
    .catch(function () {});

  function readableOn(hex) {
    var n = parseInt(hex.slice(1), 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return 1.05 / (l + 0.05) >= (l + 0.05) / 0.0574 ? "#ffffff" : "#18131f";
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function mount(cfg) {
    var color = /^#[0-9a-f]{6}$/i.test(cfg.brandColor) ? cfg.brandColor : "#8f67ee";
    var fg = readableOn(color);
    var host = document.createElement("div");
    host.setAttribute("data-askdock", "");
    var root = host.attachShadow({ mode: "open" });

    root.innerHTML =
      "<style>" +
      ":host{all:initial}" +
      ".wrap{position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}" +
      ".bubble{width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:" + color + ";color:" + fg + ";display:grid;place-items:center;box-shadow:0 12px 30px -8px rgba(24,19,31,.45),0 4px 10px -4px rgba(24,19,31,.3);transition:transform .2s ease}" +
      ".bubble:hover{transform:translateY(-2px) scale(1.03)}" +
      ".bubble:focus-visible{outline:3px solid " + color + "55;outline-offset:3px}" +
      ".bubble svg{width:28px;height:28px;transition:transform .25s ease,opacity .2s}" +
      ".bubble .x{position:absolute;opacity:0;transform:rotate(-45deg)}" +
      ".open .bubble .chat{opacity:0;transform:rotate(45deg)}.open .bubble .x{opacity:1;transform:none}" +
      ".panel{position:absolute;bottom:76px;" + side + ":0;width:380px;height:min(640px,calc(100vh - 120px));border-radius:22px;overflow:hidden;background:#fbf8f4;box-shadow:0 30px 80px -24px rgba(24,19,31,.45),0 8px 24px -12px rgba(24,19,31,.25);opacity:0;transform:translateY(12px) scale(.98);transform-origin:bottom " + side + ";pointer-events:none;transition:opacity .2s ease,transform .25s ease}" +
      ".open .panel{opacity:1;transform:none;pointer-events:auto}" +
      ".panel iframe{width:100%;height:100%;border:0;display:block}" +
      ".greet{position:absolute;bottom:72px;" + side + ":0;width:max-content;max-width:min(270px,calc(100vw - 40px));background:#fff;color:#18131f;border-radius:16px;padding:12px 30px 12px 14px;font-size:14px;line-height:1.45;box-shadow:0 14px 34px -14px rgba(24,19,31,.4);cursor:pointer;animation:in .35s ease both}" +
      ".greet button{position:absolute;top:6px;right:6px;border:0;background:transparent;color:#888;cursor:pointer;font-size:16px;line-height:1}" +
      ".open .greet{display:none}" +
      "@keyframes in{from{opacity:0;transform:translateY(8px)}}" +
      "@media (max-width:480px){.panel{position:fixed;inset:0;width:auto;height:auto;border-radius:0}.open .bubble{display:none}}" +
      "@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}" +
      "</style>" +
      '<div class="wrap">' +
      '<div class="panel" role="dialog" aria-label="' + esc(cfg.name) + ' chat"></div>' +
      '<button class="bubble" type="button" aria-expanded="false" aria-label="Chat with ' + esc(cfg.name) + '">' +
      '<svg class="chat" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4.5h14A2.5 2.5 0 0121.5 7v8a2.5 2.5 0 01-2.5 2.5h-6.6L7.6 21a.6.6 0 01-1-.5v-3H5A2.5 2.5 0 012.5 15V7A2.5 2.5 0 015 4.5zm3 6.2a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zm4 0a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zm4 0a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6z"/></svg>' +
      '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "</button></div>";

    document.body.appendChild(host);
    var wrap = root.querySelector(".wrap");
    var panel = root.querySelector(".panel");
    var bubble = root.querySelector(".bubble");
    var frame = null;

    function setOpen(open) {
      if (open && !frame) {
        frame = document.createElement("iframe");
        frame.title = cfg.name + " chat";
        frame.allow = "clipboard-write";
        frame.src = origin + "/embed/" + encodeURIComponent(botId) + "?mode=widget";
        panel.appendChild(frame);
      }
      wrap.classList.toggle("open", open);
      bubble.setAttribute("aria-expanded", String(open));
      try {
        sessionStorage.setItem("askdock_seen", "1");
      } catch {}
      var greet = root.querySelector(".greet");
      if (open && greet) greet.remove();
    }

    bubble.addEventListener("click", function () {
      setOpen(!wrap.classList.contains("open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wrap.classList.contains("open")) setOpen(false);
    });
    window.addEventListener("message", function (e) {
      if (e.origin === origin && e.data === "askdock:close") setOpen(false);
    });

    var seen = false;
    try {
      seen = sessionStorage.getItem("askdock_seen") === "1";
    } catch {}
    if (showGreeting && !seen && cfg.greeting) {
      setTimeout(function () {
        if (wrap.classList.contains("open")) return;
        var greet = document.createElement("div");
        greet.className = "greet";
        greet.innerHTML = esc(cfg.greeting) + '<button type="button" aria-label="Dismiss">×</button>';
        greet.addEventListener("click", function (e) {
          if (e.target.tagName === "BUTTON") {
            greet.remove();
            try {
              sessionStorage.setItem("askdock_seen", "1");
            } catch {}
          } else setOpen(true);
        });
        wrap.insertBefore(greet, bubble);
      }, 3500);
    }

    window.AskDock = {
      open: function () {
        setOpen(true);
      },
      close: function () {
        setOpen(false);
      },
    };
  }
})();
