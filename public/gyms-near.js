// The map of the ten gyms closest to the visitor on the website's /gyms/ page (src/server/gymsNear.ts draws the
// section, hidden; this shows it). Plain browser script, served from our own origin with Leaflet next to it
// (public/vendor/leaflet/, copied by scripts/leaflet.mjs). Tiles come through /api/gyms/tile/, so the Mapbox token
// stays on the server. docs/decisions/gyms.md "The gyms page leads with a map".
//
// Where we look: the browser's position when the visitor already allowed it for this site or taps Use my location
// (rounded to about 1 km before it leaves the page), otherwise the rough spot Vercel works out from the address, which
// needs no prompt. When neither works, the city search and the full directory below take over.
(function () {
  "use strict";
  var root = document.getElementById("near");
  var textEl = document.getElementById("near-text");
  if (!root || !textEl || !window.fetch) return;
  var T = JSON.parse(textEl.textContent || "{}");
  var status = document.getElementById("near-status");
  var list = document.getElementById("near-list");
  var locate = document.getElementById("near-locate");
  var mapEl = document.getElementById("near-map");
  var body = document.getElementById("near-body");
  var L = window.L;
  var lang = document.documentElement.lang || "en";
  // Miles where people think in miles (the United States, Liberia, Myanmar and the UK's roads).
  var miles = /^en-(US|LR|MM|GB)$/i.test(navigator.language || "") || /^my\b/i.test(navigator.language || "");
  var num = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
  var fill = function (s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (all, k) {
      return k in vars ? String(vars[k]) : all;
    });
  };
  var map = null;
  var layer = null;
  var hadDevice = false;

  root.hidden = false;
  var find = document.getElementById("find");
  if (find) find.hidden = false;

  function say(s) {
    if (status) status.textContent = s;
  }

  function distance(km) {
    return miles ? fill(T.mi, { distance: num.format(km * 0.621371) }) : fill(T.km, { distance: num.format(km) });
  }

  function tileStyle() {
    return "dark"; // The website is dark (siteFrame.ts).
  }

  function focusRow(i) {
    var row = list && list.querySelectorAll("a")[i];
    if (!row) return;
    row.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    row.focus({ preventScroll: true });
  }

  function drawList(gyms) {
    list.textContent = "";
    gyms.forEach(function (g, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = g.path;
      var pin = document.createElement("span");
      pin.className = "pin";
      pin.setAttribute("aria-hidden", "true");
      pin.textContent = String(i + 1);
      var txt = document.createElement("span");
      txt.className = "txt";
      var name = document.createElement("span");
      name.className = "li-name";
      name.textContent = g.name;
      var line = document.createElement("span");
      line.className = "muted small";
      line.textContent = [distance(g.km), g.where].filter(Boolean).join(" · ");
      txt.appendChild(name);
      txt.appendChild(line);
      if (g.official) {
        var on = document.createElement("span");
        on.className = "small on";
        on.textContent = T.official;
        txt.appendChild(on);
      }
      a.appendChild(pin);
      a.appendChild(txt);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function drawMap(here, gyms) {
    if (!mapEl || !L || root.dataset.map !== "1") {
      if (mapEl) mapEl.hidden = true;
      return;
    }
    if (!map) {
      map = L.map(mapEl, { scrollWheelZoom: false, zoomSnap: 0.5, attributionControl: false });
      L.control.attribution({ prefix: false }).addAttribution(T.credit).addTo(map);
      L.tileLayer("/api/gyms/tile/?z={z}&x={x}&y={y}&style=" + tileStyle(), { maxZoom: 18, minZoom: 3, tileSize: 256 }).addTo(map);
      // Scrolling the page past the map shouldn't zoom it: the wheel zooms once the map has been clicked or focused.
      map.on("focus click", function () {
        map.scrollWheelZoom.enable();
      });
      map.on("blur", function () {
        map.scrollWheelZoom.disable();
      });
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    var points = [];
    gyms.forEach(function (g, i) {
      points.push([g.lat, g.lon]);
      L.marker([g.lat, g.lon], {
        title: g.name,
        alt: fill(T.pin, { n: i + 1, name: g.name }),
        keyboard: true,
        icon: L.divIcon({ className: "gym-pin", html: "<span>" + (i + 1) + "</span>", iconSize: [28, 28], iconAnchor: [14, 14] }),
        zIndexOffset: gyms.length - i,
      })
        .on("click", function () {
          focusRow(i);
        })
        .addTo(layer);
    });
    if (here) {
      L.circleMarker([here.lat, here.lon], { radius: 7, weight: 3, color: "#fff", fillColor: "#38d6e8", fillOpacity: 1, interactive: false }).addTo(
        layer,
      );
      points.push([here.lat, here.lon]);
    }
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    else map.setView([20, 0], 3);
  }

  function lookFor(spot) {
    var q = "/api/gyms/?closest=1" + (spot ? "&lat=" + spot.lat + "&lon=" + spot.lon : "");
    return fetch(q, { headers: { accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(function (data) {
        var here = data.here;
        var gyms = data.gyms || [];
        if (!here) {
          say(T.unknown);
          if (body && !map) body.hidden = true;
          showLocate();
          return;
        }
        if (here.from === "device") hadDevice = true;
        if (!gyms.length) say(T.none);
        else if (here.from === "device") say(T.fromDevice);
        else say(here.city ? fill(T.fromIpCity, { city: here.city }) : T.fromIp);
        if (body) body.hidden = !gyms.length;
        drawList(gyms);
        drawMap(here, gyms);
        if (here.from === "device") hideLocate();
        else showLocate();
      })
      .catch(function () {
        say(T.failed);
        if (body && !map) body.hidden = true;
      });
  }

  function showLocate() {
    if (locate && navigator.geolocation) locate.hidden = false;
  }
  function hideLocate() {
    if (locate) locate.hidden = true;
  }

  function fromDevice(onFail) {
    say(T.finding);
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        // About 1 km, like the app's finder: the exact spot never leaves the page.
        var round = function (x) {
          return Math.round(x * 100) / 100;
        };
        void lookFor({ lat: round(pos.coords.latitude), lon: round(pos.coords.longitude) });
      },
      function (err) {
        if (err && err.code === 1) {
          hideLocate();
          say(T.denied);
          var input = document.getElementById("city-search");
          if (input) input.focus();
        }
        if (onFail) onFail();
        else if (!err || err.code !== 1) say(hadDevice ? T.fromDevice : T.failed);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  if (locate) {
    locate.addEventListener("click", function () {
      fromDevice(null);
    });
  }

  // Already allowed for this site: go straight to the closest gyms. Otherwise start from the address, no prompt.
  var start = function () {
    void lookFor(null);
  };
  if (navigator.geolocation && navigator.permissions && navigator.permissions.query) {
    navigator.permissions
      .query({ name: "geolocation" })
      .then(function (p) {
        if (p.state === "granted") fromDevice(start);
        else start();
      })
      .catch(start);
  } else start();

  // The city search filters the full directory and opens it.
  var input = document.getElementById("city-search");
  var cities = document.getElementById("city-list");
  var none = document.getElementById("city-none");
  var dir = document.getElementById("directory");
  if (input && cities) {
    var fold = function (s) {
      return s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
    };
    var rows = Array.prototype.slice.call(cities.children);
    var names = rows.map(function (li) {
      return fold(li.textContent || "");
    });
    input.addEventListener("input", function () {
      var q = fold(input.value.trim());
      var shown = 0;
      rows.forEach(function (li, i) {
        var hit = !q || names[i].indexOf(q) !== -1;
        li.hidden = !hit;
        // The first row shown drops its top rule, as the list's first row does.
        li.classList.toggle("lead", hit && shown === 0);
        if (hit) shown++;
      });
      if (none) none.hidden = shown > 0;
      if (q && dir) dir.open = true;
    });
  }
})();
