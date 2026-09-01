/* AURA North America — site scripts */
(function () {
  "use strict";

  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Scroll progress bar */
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  body.appendChild(progress);

  /* Light parallax target (homepage hero drawing only — interior page art
     uses the reveal slide-in, which an inline transform would override) */
  var heroArt = document.querySelector(".hero__art");

  /* Solid header + progress + parallax, one scroll handler */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-solid", y > 24);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      if (!reduceMotion && heroArt) {
        heroArt.style.transform = "translateY(" + y * -0.06 + "px)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  if (toggle) {
    toggle.addEventListener("click", function () {
      body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", body.classList.contains("nav-open") ? "true" : "false");
    });
  }

  /* Mobile: capability dropdown expands on tap */
  document.querySelectorAll(".has-drop > a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 980) {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });

  /* Close mobile nav when a link is chosen */
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (window.innerWidth <= 980 && !a.parentElement.classList.contains("has-drop")) {
        body.classList.remove("nav-open");
      }
    });
  });

  /* Animated counters for stat strips (e.g. "15+", "100%") */
  function runCounters(strip) {
    strip.querySelectorAll("b").forEach(function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m || reduceMotion) return;
      var target = parseInt(m[1], 10);
      var suffix = m[2];
      var t0 = null;
      var dur = 1200;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* Reveal-on-scroll (also drives timeline line-draw + counters) */
  var observed = document.querySelectorAll(".reveal, .timeline, .stat-strip");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          if (entry.target.classList.contains("stat-strip")) runCounters(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observed.forEach(function (el) { io.observe(el); });
  } else {
    observed.forEach(function (el) { el.classList.add("in"); });
  }

  /* 3D tilt on cards (desktop pointers only) */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".cap-card, .proj-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = (0.5 - (e.clientY - r.top) / r.height) * 6;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        card.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-5px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* Quote form: progressive enhancement over the PHP handler */
  var quoteForm = document.getElementById("quote-form");
  if (quoteForm) {
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      var btn = quoteForm.querySelector("button[type=submit]");
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
      status.className = "form-status";

      var data = new FormData(quoteForm);
      fetch(quoteForm.getAttribute("action"), { method: "POST", body: data })
        .then(function (res) { return res.json().catch(function () { throw new Error("bad response"); }); })
        .then(function (json) {
          if (json && json.ok) {
            status.textContent = "Thank you — your request has been sent. Our engineering team will get back to you within one business day.";
            status.className = "form-status ok";
            quoteForm.reset();
          } else {
            throw new Error((json && json.error) || "send failed");
          }
        })
        .catch(function () {
          status.textContent = "We couldn't send your request automatically. Please email us directly at the address below — we answer every message.";
          status.className = "form-status err";
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  }

  /* Portal login placeholder (phase 2 backend not yet live) */
  var portalForm = document.getElementById("portal-form");
  if (portalForm) {
    portalForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("portal-status");
      note.textContent = "Portal accounts are provisioned by your Aura account manager. If you have an active program with us and need access, contact us and we'll set you up.";
      note.className = "form-status ok";
    });
  }
})();
