/* inscricao.js — login por código, escolha das oficinas, confirmação e "Onde eu vou?" (usa shared.js e o array A do index) */
(function () {
  var box = document.getElementById("ins");
  if (!box) return;
  var S = null, busy = false, msg = "", msgT = "", fromUrl = /[?&]c=/.test(location.search);
  var sel = { 1: "", 2: "" };            // escolha ainda não enviada (só no celular)
  var HORA = { 1: "8h00 às 9h10", 2: "9h30 às 10h40" };

  // estilo do botão de destaque da fantasia (fica aqui para não depender do shared.css)
  (function () {
    var st = document.createElement("style");
    st.textContent = ".fant-cta{display:block;margin:14px 0;padding:16px 18px;border-radius:16px;text-decoration:none;" +
      "color:#1a0b00;background:linear-gradient(135deg,#ffb347,#ff7a1a 55%,#ff4d6d);" +
      "box-shadow:0 8px 24px rgba(255,122,26,.35);border:2px solid rgba(255,255,255,.4);animation:fantp 2.2s ease-in-out infinite}" +
      ".fant-cta b{display:block;font-size:1.2rem;margin-bottom:2px}.fant-cta span{font-size:.92rem;opacity:.85}" +
      "@keyframes fantp{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}" +
      "@media (prefers-reduced-motion:reduce){.fant-cta{animation:none}}";
    document.head.appendChild(st);
  })();

  function info(id) {
    return (typeof A !== "undefined" && A.filter(function (x) { return x.id == id; })[0]) || {};
  }
  function ofic(id) {
    return S.oficinas.filter(function (o) { return o.id == id; })[0] || null;
  }
  function syncSel() { sel[1] = S.b1; sel[2] = S.b2; }
  function igual(a, b) { return String(a) === String(b); }

  function loginForm() {
    return '<div class="glass ins-box"><label for="cod" class="ins-l">Código do seu ingresso</label>' +
      '<div class="ins-row"><input id="cod" class="in" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="ABCDE">' +
      '<button class="btn" id="go">Entrar</button></div>' +
      (msg ? '<div class="msg err">' + esc(msg) + "</div>" : "") +
      '<p class="ins-h">O código está no seu ingresso de Halloween.</p></div>';
  }

  function card(o) {
    var salva = igual(S["b" + o.bloco], o.id), escolhida = igual(sel[o.bloco], o.id), a = info(o.id);
    var lot = o.livres === 0 && !salva, aberta = S.cfg.inscricoes;
    var chip = o.livres === null ? "" : '<span>' + (lot ? "Lotada" : o.livres + (o.livres == 1 ? " vaga" : " vagas")) + "</span>";
    var rotulo = escolhida ? (salva ? "Você está nesta ✓" : "Escolhida ✓") : lot ? "Lotada" : "Quero esta";
    return '<article class="card" style="--c:' + (a.c || "#ff7a1a") + '">' +
      '<div class="ins-top"><div class="ins-e" aria-hidden="true">' + (a.e || "") + "</div><div><h3>" + esc(o.nome) + '</h3><div class="ins-s">' + esc(o.sala) + "</div></div></div>" +
      (chip ? '<div class="meta">' + chip + "</div>" : "") +
      (aberta
        ? '<button class="pick" data-bl="' + o.bloco + '" data-of="' + o.id + '" aria-pressed="' + escolhida + '"' + ((lot && !escolhida) || busy ? " disabled" : "") + ">" + rotulo + "</button>"
        : (salva ? '<div class="note">Você está nesta</div>' : "")) +
      "</article>";
  }

  function nomeEscolha(b) {
    var o = sel[b] === "" ? null : ofic(sel[b]);
    return o ? esc(o.nome) : "<em>ainda não escolhida</em>";
  }

  function confirmBox() {
    var ambas = sel[1] !== "" && sel[2] !== "";
    var jaSalva = S.b1 !== "" && S.b2 !== "";
    var mudou = !igual(sel[1], S.b1) || !igual(sel[2], S.b2);
    var rotulo = busy ? "Enviando…" :
      !ambas ? "Escolha uma oficina em cada bloco" :
      mudou ? (jaSalva ? "Atualizar inscrição" : "Confirmar inscrição") :
      "Inscrição confirmada ✓";
    var aviso = "";
    if (!busy && mudou && jaSalva) aviso = '<p class="ins-h">Você mudou sua escolha. Toque em atualizar para valer.</p>';
    else if (!busy && !jaSalva && ambas) aviso = '<p class="ins-h">Sua inscrição só vale depois de confirmar.</p>';
    return '<div class="glass ins-box" id="conf-box"><b>Sua escolha</b>' +
      "<p>Bloco 1 · " + HORA[1] + "<br>" + nomeEscolha(1) + "</p>" +
      "<p>Bloco 2 · " + HORA[2] + "<br>" + nomeEscolha(2) + "</p>" +
      (msg ? '<div class="msg ' + msgT + '">' + esc(msg) + "</div>" : "") +
      aviso +
      '<button class="btn" id="conf"' + (busy || !ambas || !mudou ? " disabled" : "") + ">" + rotulo + "</button></div>";
  }

  function passe() {
    function lin(b) {
      var o = S["b" + b] === "" ? null : ofic(S["b" + b]);
      return "<p>Bloco " + b + " · " + HORA[b] + "<br>" +
        (o ? esc(o.nome) + " · <small>" + esc(o.sala) + "</small>" : "<small>Ainda não confirmado</small>") + "</p>";
    }
    return '<div class="pass">' + lin(1) + lin(2) + "<p>10h50 às 12h00<br>Desfile, votação e premiação · <small>Foyer</small></p></div>";
  }

  function render() {
    if (!S) { box.innerHTML = loginForm(); return; }
    var c = S.cfg, h = '<div class="glass ins-box"><div class="ins-who"><div><b>Olá, ' + esc(S.nome) + "</b><br>" +
      '<span class="ins-s">Turma ' + esc(S.turma) + " · código " + esc(S.codigo) + '</span></div><button class="btn ghost" id="sair">Sair</button></div></div>';
    if (c.cadastro_fantasia) h += '<a class="fant-cta" href="fantasia.html"><b>🎭 Cadastrar minha fantasia</b>' +
      "<span>Entre na votação do desfile. Leva só 1 minuto.</span></a>";
    if (msg && !c.inscricoes) h += '<div class="msg ' + msgT + '">' + esc(msg) + "</div>";
    if (c.inscricoes) h += '<div class="msg ok">Inscrições abertas. Escolha uma oficina em cada bloco e depois toque em confirmar.</div>';
    else h += '<div class="msg">As inscrições não estão abertas agora.' +
      (S.b1 === "" || S.b2 === "" ? " Quem não escolher será colocado em uma oficina com vaga." : "") + "</div>";
    [1, 2].forEach(function (b) {
      h += '<h3 class="ins-bl">Bloco ' + b + " · " + HORA[b] + "</h3>";
      S.oficinas.filter(function (o) { return o.bloco == b; }).forEach(function (o) { h += card(o); });
    });
    if (c.inscricoes) h += confirmBox();
    h += '<h3 class="ins-bl">Onde eu vou?</h3>' + passe();
    if (c.voto_cartaz || c.voto_individual || c.voto_grupo) h += '<a class="go" href="votacao.html">Ir para a votação</a>';
    box.innerHTML = h;
  }

  function verConfirmacao() {
    var el = document.getElementById("conf-box");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" });
  }

  function entrar(c) {
    c = (c || "").trim();
    if (!c) { msg = "Digite o código do ingresso."; render(); return; }
    box.innerHTML = '<div class="glass ins-box">Procurando seu código…</div>';
    api("login", { c: c }).then(function (j) {
      if (j.erro) { msg = j.erro; S = null; clearCode(); render(); return; }
      setCode(j.codigo); S = j; syncSel(); msg = ""; msgT = ""; render();
      if (fromUrl) { fromUrl = false; var s = document.getElementById("inscricao"); if (s) s.scrollIntoView(); }
    }).catch(function () { msg = "Sem conexão. Tente de novo."; S = null; render(); });
  }

  /* atualiza vagas e configuração sem perder o que o aluno já escolheu na tela */
  function refresh() {
    api("login", { c: S.codigo }).then(function (j) { if (j.ok) S = j; render(); }).catch(function () { render(); });
  }

  function alternar(b, id) {
    if (busy) return;
    sel[b] = igual(sel[b], id) ? "" : id;
    msg = ""; msgT = "";
    render();
  }

  function confirmar() {
    if (busy || sel[1] === "" || sel[2] === "") return;
    busy = true; msg = "Enviando sua inscrição…"; msgT = ""; render();
    // pequeno atraso aleatório para espalhar os envios quando muita gente confirma junto
    setTimeout(function () {
      api("inscrever_tudo", { c: S.codigo, b1: sel[1], b2: sel[2] }, {
        tries: 5,
        onRetry: function (n) { msg = "Servidor ocupado, tentando de novo (" + n + ")…"; render(); }
      }).then(function (j) {
        busy = false;
        if (j.erro) {
          msg = j.erro; msgT = "err";
          if (j.lotada && j.bloco) sel[j.bloco] = "";
          if (j.lotada || j.fechada) { refresh(); setTimeout(verConfirmacao, 50); return; }
          render(); verConfirmacao(); return;
        }
        S = j; syncSel();
        msg = "Inscrição confirmada ✓ às " + (j.recibo || "agora"); msgT = "ok";
        render(); verConfirmacao();
      }).catch(function () {
        busy = false;
        msg = "Sem conexão. Sua inscrição NÃO foi enviada. Toque em confirmar de novo."; msgT = "err";
        render(); verConfirmacao();
      });
    }, Math.random() * 2000);
  }

  box.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.id === "go") entrar(document.getElementById("cod").value);
    else if (t.id === "sair") { clearCode(); S = null; msg = ""; sel = { 1: "", 2: "" }; render(); }
    else if (t.id === "conf") confirmar();
    else if (t.dataset.of) alternar(+t.dataset.bl, +t.dataset.of);
  });
  box.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "cod") entrar(e.target.value);
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && S && !busy) refresh();
  });

  var c0 = getCode();
  if (c0) entrar(c0); else render();
})();
