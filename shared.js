/* shared.js — conexão com o Apps Script e utilitários (usado por index, votacao e painel) */
var API = "https://script.google.com/macros/s/AKfycbwOAy-J2qqgfsu93bj9YTYHwEG58_LnwLmC_oGL0GV5NuRkT34fzKWBQv_5zcLSSV7X6g/exec";
var EXTS = ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function getCode() {
  var m = /[?&]c=([A-Za-z0-9]+)/.exec(location.search);
  if (m) return m[1].toUpperCase();
  try { return localStorage.getItem("hw_codigo") || ""; } catch (e) { return ""; }
}
function setCode(c) { try { localStorage.setItem("hw_codigo", c); } catch (e) {} }
function clearCode() {
  try { localStorage.removeItem("hw_codigo"); } catch (e) {}
  if (/[?&]c=/.test(location.search)) history.replaceState(null, "", location.pathname);
}

/* GET no Apps Script, com tentativas automáticas quando o servidor está ocupado ou a rede falha */
function api(a, d, o) {
  o = o || {};
  var max = o.tries || 4;
  return new Promise(function (ok, fail) {
    var n = 0;
    (function go() {
      n++;
      fetch(API + "?a=" + a + "&d=" + encodeURIComponent(JSON.stringify(d || {})))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.tentar && n < max) {
            if (o.onRetry) o.onRetry(n);
            return setTimeout(go, 700 * n + Math.random() * 700);
          }
          ok(j);
        })
        .catch(function (e) {
          if (n < max) {
            if (o.onRetry) o.onRetry(n);
            setTimeout(go, 900 * n + Math.random() * 900);
          } else fail(e);
        });
    })();
  });
}

/* POST no Apps Script (usado para enviar fotos). Sem Content-Type para evitar o preflight de CORS. */
function apiPost(a, d, o) {
  o = o || {};
  var max = o.tries || 3;
  return new Promise(function (ok, fail) {
    var n = 0;
    (function go() {
      n++;
      fetch(API, { method: "POST", body: JSON.stringify({ a: a, d: d || {} }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.tentar && n < max) {
            if (o.onRetry) o.onRetry(n);
            return setTimeout(go, 800 * n + Math.random() * 800);
          }
          ok(j);
        })
        .catch(function (e) {
          if (n < max) { if (o.onRetry) o.onRetry(n); setTimeout(go, 900 * n); }
          else fail(e);
        });
    })();
  });
}

/* Foto do cartaz: primeiro a foto enviada pelo painel (Google Drive); se não houver, img/ID.jpg (.jpeg, .png) */
function fontes(id, foto) {
  var l = [];
  if (foto) {
    l.push("https://drive.google.com/thumbnail?id=" + foto + "&sz=w1600");
    l.push("https://lh3.googleusercontent.com/d/" + foto + "=w1600");
  }
  EXTS.forEach(function (x) { l.push("img/" + id + "." + x); });
  return l;
}
function imgTag(id, alt, foto) {
  return '<img class="foto" loading="lazy" alt="' + esc(alt || "") + '" data-id="' + id + '"' + (foto ? ' data-foto="' + esc(foto) + '"' : "") +
    ' data-n="0" src="' + esc(fontes(id, foto)[0]) + '">';
}
document.addEventListener("error", function (e) {
  var t = e.target;
  if (!t || t.tagName !== "IMG" || !t.dataset.id) return;
  var l = fontes(t.dataset.id, t.dataset.foto || ""), n = +t.dataset.n + 1;
  if (n < l.length) { t.dataset.n = n; t.src = l[n]; }
  else {
    var d = document.createElement("div");
    d.className = "semfoto";
    d.textContent = "Foto ainda não disponível";
    t.replaceWith(d);
  }
}, true);
