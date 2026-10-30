/* inscricao.js — login por código, escolha das oficinas direto nos cartões da programação,
   confirmação em uma só chamada, aviso "não vem" e "Onde eu vou?" (usa shared.js e o array A do index) */
(function () {
  var box = document.getElementById("ins");
  if (!box) return;
  var S = null, busy = false, nvBusy = false, msg = "", msgT = "", nmsg = "", nmsgT = "";
  var fromUrl = /[?&]c=/.test(location.search);
  var sel = { 1: "", 2: "" };            // escolha ainda não enviada (só no celular)
  var HORA = { 1: "8h00 às 9h10", 2: "9h30 às 10h40" };
  var bar = null;

  /* estilos próprios deste script (não dependem do shared.css) */
  (function () {
    var st = document.createElement("style");
    st.textContent =
      ".fant-cta{display:block;margin:14px 0;padding:16px 18px;border-radius:16px;text-decoration:none;color:#1a0b00;" +
      "background:linear-gradient(135deg,#ffb347,#ff7a1a 55%,#ff4d6d);box-shadow:0 8px 24px rgba(255,122,26,.35);" +
      "border:2px solid rgba(255,255,255,.4);animation:fantp 2.2s ease-in-out infinite}" +
      ".fant-cta b{display:block;font-size:1.2rem;margin-bottom:2px}.fant-cta span{font-size:.92rem;opacity:.85}" +
      "@keyframes fantp{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}" +
      "@media (prefers-reduced-motion:reduce){.fant-cta{animation:none}}" +
      ".slot:empty{display:none}.slot{margin-top:10px}.slot .meta{margin:0 0 8px}" +
      ".pick:disabled{opacity:.55;cursor:default}" +
      ".pw{margin:12px 0 4px;padding:10px 14px;border-radius:14px;background:#ffffff14;font-size:.92rem}" +
      ".pw a{color:var(--lima);font-weight:700}" +
      "#insbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom,0px));" +
      "width:min(94vw,680px);z-index:8;padding:12px 14px;border-radius:20px;background:#1a0f33f2;" +
      "border:1.5px solid var(--lar);box-shadow:0 12px 40px #000c;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}" +
      "#insbar .bl{display:grid;gap:2px;font-size:.88rem;margin-bottom:8px}#insbar .bl b{color:var(--lima)}" +
      "#insbar .m{font-size:.85rem;margin-bottom:8px;padding:6px 10px;border-radius:10px;background:#ffffff14}" +
      "#insbar .m.ok{background:#12381f;color:#c8f5d4}#insbar .m.err{background:#4a1220;color:#ffc9d2}" +
      "#insbar button{width:100%;font:inherit;font-weight:800;padding:12px;border:0;border-radius:14px;" +
      "background:linear-gradient(90deg,var(--lar),var(--rosa));color:#12082a;cursor:pointer}" +
      "#insbar button:disabled{opacity:.6;cursor:default}" +
      "body.hasbar main{padding-bottom:250px}" +
      ".nvbox{margin-top:22px}";
    document.head.appendChild(st);
  })();

  function ofic(id) { return S.oficinas.filter(function (o) { return o.id == id; })[0] || null; }
  function syncSel() { sel[1] = S.b1; sel[2] = S.b2; }
  function igual(a, b) { return String(a) === String(b); }

  /* ---------- área "Minha inscrição" ---------- */
  function loginForm() {
    return '<div class="glass ins-box"><label for="cod" class="ins-l">Código do seu ingresso</label>' +
      '<div class="ins-row"><input id="cod" class="in" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="ABCDE">' +
      '<button class="btn" id="go">Entrar</button></div>' +
      (nmsg ? '<div class="msg err">' + esc(nmsg) + "</div>" : "") +
      '<p class="ins-h">O código está no seu ingresso de Halloween.</p></div>';
  }

  function passe() {
    function lin(b) {
      var o = S["b" + b] === "" ? null : ofic(S["b" + b]);
      return "<p>Bloco " + b + " · " + HORA[b] + "<br>" +
        (o ? esc(o.nome) + " · <small>" + esc(o.sala) + "</small>" : "<small>Ainda não confirmado</small>") + "</p>";
    }
    return '<div class="pass">' + lin(1) + lin(2) +
      "<p>10h50 às 12h00<br>Desfile, votação e premiação · <small>Foyer (ou atividade no Auditório, ao lado)</small></p></div>";
  }

  function render() {
    if (!S) { box.innerHTML = loginForm(); return; }
    var c = S.cfg;
    var h = '<div class="glass ins-box"><div class="ins-who"><div><b>Olá, ' + esc(S.nome) + "</b><br>" +
      '<span class="ins-s">Turma ' + esc(S.turma) + " · código " + esc(S.codigo) + '</span></div><button class="btn ghost" id="sair">Sair</button></div></div>';
    if (c.cadastro_fantasia && !S.nv) h += '<a class="fant-cta" href="fantasia.html"><b>🎭 Cadastrar minha fantasia</b>' +
      "<span>Entre na votação do desfile. Leva só 1 minuto.</span></a>";
    if (nmsg) h += '<div class="msg ' + nmsgT + '">' + esc(nmsg) + "</div>";

    if (S.nv) {
      h += '<div class="msg">Você avisou que <b>não vem</b> no sábado letivo. As vagas que você tinha foram liberadas.</div>' +
        '<div class="nvbox"><button class="btn" id="nvoff"' + (nvBusy ? " disabled" : "") + ">Mudei de ideia, eu vou</button>" +
        (c.inscricoes ? "" : '<p class="ins-h">As inscrições já fecharam: se você voltar, a escola coloca você em uma oficina com vaga.</p>') + "</div>";
    } else {
      if (c.inscricoes) {
        h += '<div class="msg ok">Inscrições abertas. Escolha uma oficina em cada bloco, direto nos cartões da <a href="#programa">Programação</a>, e confirme.</div>';
      } else {
        h += '<div class="msg">As inscrições não estão abertas agora.' +
          (S.b1 === "" || S.b2 === "" ? " Quem não escolher será colocado em uma oficina com vaga." : "") + "</div>";
      }
      h += '<h3 class="ins-bl">Onde eu vou?</h3>' + passe();
      if (c.inscricoes && (S.b1 === "" || S.b2 === "")) h += '<a class="go" href="#programa">Escolher minhas oficinas</a>';
      if (c.voto_cartaz || c.voto_individual || c.voto_grupo) h += '<a class="go" href="votacao.html">Ir para a votação</a>';
      h += '<div class="nvbox"><button class="btn ghost" id="nvon"' + (nvBusy ? " disabled" : "") + ">Não vou poder ir no sábado letivo</button></div>";
    }
    box.innerHTML = h;
  }

  /* ---------- cartões da programação ---------- */
  function paintCards() {
    var slots = document.querySelectorAll(".slot[data-of]");
    Array.prototype.forEach.call(slots, function (slot) {
      var id = +slot.dataset.of, b = +slot.dataset.bl, h = "", o = S && ofic(id);
      if (S && !S.nv && o) {
        var salva = igual(S["b" + b], id), escolhida = igual(sel[b], id), aberta = S.cfg.inscricoes;
        var lot = o.livres === 0 && !salva;
        if (aberta) {
          if (o.livres !== null) h += '<div class="meta"><span>' + (lot && !escolhida ? "Lotada" : o.livres + (o.livres == 1 ? " vaga" : " vagas")) + "</span></div>";
          h += '<button class="pick" data-bl="' + b + '" data-of="' + id + '" aria-pressed="' + escolhida + '"' +
            ((lot && !escolhida) || busy ? " disabled" : "") + ">" +
            (escolhida ? (salva ? "Você está nesta ✓" : "Escolhida ✓") : lot ? "Lotada" : "Quero esta") + "</button>";
        } else if (salva) {
          h += '<div class="note">Você está nesta ✓</div>';
        }
      }
      if (slot.innerHTML !== h) slot.innerHTML = h;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".seg button[data-b]"), function (t) {
      if (!t.dataset.base) t.dataset.base = t.textContent;
      var n = +t.dataset.b, ok = S && !S.nv && S.cfg.inscricoes && sel[n] !== "";
      var txt = t.dataset.base + (ok ? " ✓" : "");
      if (t.textContent !== txt) t.textContent = txt;
    });
  }

  function paintWho() {
    var pw = document.getElementById("progwho");
    if (!pw) return;
    var h;
    if (!S) h = 'Para escolher suas oficinas, <a href="#inscricao">entre com o código do seu ingresso</a>.';
    else if (S.nv) h = 'Você avisou que não vem. Se mudou de ideia, volte em <a href="#inscricao">Minha inscrição</a>.';
    else if (!S.cfg.inscricoes) h = "As inscrições não estão abertas agora.";
    else h = "Escolhendo como <b>" + esc(S.nome) + "</b> · turma " + esc(S.turma) +
      ". Toque em <b>Quero esta</b> em uma oficina de cada bloco e depois em <b>Confirmar</b>.";
    pw.innerHTML = '<div class="pw">' + h + "</div>";
  }

  /* ---------- barra de confirmação ---------- */
  function nomeEscolha(b) {
    var o = sel[b] === "" ? null : ofic(sel[b]);
    return o ? esc(o.nome) : "—";
  }

  function paintBar() {
    var vis = !!(S && !S.nv && S.cfg.inscricoes);
    document.body.classList.toggle("hasbar", vis);
    if (!vis) { if (bar) { bar.remove(); bar = null; } return; }
    if (!bar) { bar = document.createElement("div"); bar.id = "insbar"; document.body.appendChild(bar); }
    var falta = sel[1] === "" ? 1 : sel[2] === "" ? 2 : 0;
    var jaSalva = S.b1 !== "" && S.b2 !== "";
    var mudou = !igual(sel[1], S.b1) || !igual(sel[2], S.b2);
    var label, act, off = false, dica = "";
    if (busy) { label = "Enviando…"; act = ""; off = true; }
    else if (falta) { label = "Escolher o Bloco " + falta + " →"; act = "goto" + falta; dica = "Escolha uma oficina em cada bloco."; }
    else if (mudou) { label = jaSalva ? "Atualizar inscrição" : "Confirmar inscrição"; act = "conf"; dica = "Sua inscrição só vale depois de confirmar."; }
    else { label = "Inscrição confirmada ✓"; act = ""; off = true; }
    var m = msg ? '<div class="m ' + msgT + '">' + esc(msg) + "</div>" :
      (dica ? '<div class="m">' + dica + "</div>" : "");
    bar.innerHTML = '<div class="bl"><span><b>Bloco 1</b> · ' + nomeEscolha(1) + "</span><span><b>Bloco 2</b> · " + nomeEscolha(2) + "</span></div>" +
      m + '<button id="barbtn" data-act="' + act + '"' + (off ? " disabled" : "") + ">" + label + "</button>";
  }

  function paintAll() { render(); paintCards(); paintWho(); paintBar(); }
  window.insPaint = function () { paintCards(); };

  /* ---------- ações ---------- */
  function entrar(c) {
    c = (c || "").trim();
    if (!c) { nmsg = "Digite o código do ingresso."; paintAll(); return; }
    box.innerHTML = '<div class="glass ins-box">Procurando seu código…</div>';
    api("login", { c: c }).then(function (j) {
      if (j.erro) { nmsg = j.erro; S = null; clearCode(); paintAll(); return; }
      setCode(j.codigo); S = j; syncSel(); msg = ""; msgT = ""; nmsg = ""; nmsgT = "";
      paintAll();
      if (fromUrl) {
        fromUrl = false;
        var id = (S.cfg.inscricoes && !S.nv) ? "programa" : "inscricao", s = document.getElementById(id);
        if (s) s.scrollIntoView();
      }
    }).catch(function () { nmsg = "Sem conexão. Tente de novo."; S = null; paintAll(); });
  }

  /* atualiza vagas e configuração sem perder o que o aluno já marcou na tela */
  function refresh() {
    var limpo = S && igual(sel[1], S.b1) && igual(sel[2], S.b2);
    api("login", { c: S.codigo }).then(function (j) {
      if (j.ok) { S = j; if (limpo) syncSel(); }
      paintAll();
    }).catch(function () { paintAll(); });
  }

  function alternar(b, id) {
    if (busy) return;
    sel[b] = igual(sel[b], id) ? "" : id;
    msg = ""; msgT = "";
    paintCards(); paintBar();
  }

  function confirmar() {
    if (busy || sel[1] === "" || sel[2] === "") return;
    busy = true; msg = "Enviando sua inscrição…"; msgT = ""; paintCards(); paintBar();
    // pequeno atraso aleatório para espalhar os envios quando muita gente confirma junto
    setTimeout(function () {
      api("inscrever_tudo", { c: S.codigo, b1: sel[1], b2: sel[2] }, {
        tries: 5,
        onRetry: function (n) { msg = "Servidor ocupado, tentando de novo (" + n + ")…"; paintBar(); }
      }).then(function (j) {
        busy = false;
        if (j.erro) {
          msg = j.erro; msgT = "err";
          if (j.lotada && j.bloco) sel[j.bloco] = "";
          if (j.lotada || j.fechada || j.nv) { refresh(); return; }
          paintCards(); paintBar(); return;
        }
        S = j; syncSel();
        msg = "Inscrição confirmada ✓ às " + (j.recibo || "agora"); msgT = "ok";
        paintAll();
      }).catch(function () {
        busy = false;
        msg = "Sem conexão. Sua inscrição NÃO foi enviada. Toque em confirmar de novo."; msgT = "err";
        paintCards(); paintBar();
      });
    }, Math.random() * 2000);
  }

  function naoVem(v) {
    if (nvBusy || !S) return;
    nvBusy = true; nmsg = "Enviando…"; nmsgT = ""; render();
    api("nao_vem", { c: S.codigo, v: v }, { tries: 5 }).then(function (j) {
      nvBusy = false;
      if (j.erro) { nmsg = j.erro; nmsgT = "err"; paintAll(); return; }
      S = j; syncSel(); msg = ""; msgT = "";
      nmsg = v ? "Avisado ✓ Obrigado por avisar. Suas vagas foram liberadas." : "Tudo certo! Agora escolha suas oficinas na Programação.";
      nmsgT = "ok";
      paintAll();
    }).catch(function () {
      nvBusy = false; nmsg = "Sem conexão. Nada foi alterado. Tente de novo."; nmsgT = "err"; paintAll();
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.id === "go") entrar(document.getElementById("cod").value);
    else if (t.id === "sair") { clearCode(); S = null; msg = ""; nmsg = ""; sel = { 1: "", 2: "" }; paintAll(); }
    else if (t.id === "nvon") {
      if (window.confirm("Avisar que você NÃO vem no sábado letivo? Suas vagas nas oficinas serão liberadas.")) naoVem(true);
    }
    else if (t.id === "nvoff") naoVem(false);
    else if (t.id === "barbtn") {
      var a = t.dataset.act;
      if (a === "conf") confirmar();
      else if (a.indexOf("goto") === 0) {
        var aba = document.querySelector('.seg button[data-b="' + a.slice(4) + '"]');
        if (aba) aba.click();
        var p = document.getElementById("progwho") || document.getElementById("programa");
        if (p && p.scrollIntoView) p.scrollIntoView();
      }
    }
    else if (t.classList.contains("pick") && t.dataset.of) alternar(+t.dataset.bl, +t.dataset.of);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "cod") entrar(e.target.value);
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && S && !busy && !nvBusy) refresh();
  });

  paintWho();
  var c0 = getCode();
  if (c0) entrar(c0); else paintAll();
})();
