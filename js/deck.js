(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    deck: null,
    deckId: "",
    mode: "shop",
    cards: []
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      state.deckId = new URLSearchParams(location.search).get("id") || "";
      if (!state.deckId) throw new Error("URLにデッキIDがありません。例：deck.html?id=yomigaeri");

      const deckIndex = await fetchJson("data/decks.json");
      const entry = deckIndex.decks?.find(deck => deck.id === state.deckId);
      if (!entry) throw new Error(`decks.json に「${state.deckId}」が登録されていません。`);

      state.deck = await fetchJson(entry.file);
      state.cards = flattenCards(state.deck.sections || []);
      state.mode = loadText(modeKey(), state.deck.deck?.defaultMode || entry.defaultMode || "shop");

      renderPage();
      bindEvents();
      setMode(state.mode);
      $("#loading").hidden = true;
      $("#deckView").hidden = false;
    } catch (error) {
      console.error(error);
      $("#loading").hidden = true;
      const box = $("#error");
      box.hidden = false;
      box.textContent = `読み込みに失敗しました。${error.message} GitHub Pages上で開いているか、dataフォルダとファイル名を確認してください。`;
    }
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${path} を取得できませんでした（${response.status}）。`);
    return response.json();
  }

  function flattenCards(sections) {
    return sections.flatMap(section =>
      (section.cards || []).map(card => ({ ...card, sectionId: section.id, sectionTitle: section.title }))
    );
  }

  function renderPage() {
    const { deck, overview = {}, kanade = {}, growth = {} } = state.deck;
    document.title = `${deck.name} | MTGデッキ開発室`;
    $("#deckKicker").textContent = `${deck.symbol || "📚"} MTGデッキ開発室`;
    $("#deckTitle").textContent = deck.name;

    const meta = [];
    if (deck.format) meta.push(deck.format);
    if (deck.archetype) meta.push(deck.archetype);
    if (deck.commander) {
      const commander = typeof deck.commander === "string"
        ? deck.commander
        : [deck.commander.jp, deck.commander.en].filter(Boolean).join(" / ");
      meta.push(`統率者：${commander}`);
    }
    meta.push(`${deck.totalCards || totalQty()}枚`);
    $("#deckMeta").textContent = meta.join(" / ");
    $("#deckSummary").textContent = overview.summary || overview.concept || "";

    renderKanade(kanade);
    renderGrowth(overview, growth);
    renderSections();
    restoreCardState();
    updateProgress();
  }

  function renderKanade(kanade) {
    const growthMessages = kanade.growthMessages || ["「今日もデッキを育ててこ！」"];
    const shopMessages = kanade.shoppingMessages || ["「購入リスト、チェックしてこ！」"];
    $("#deckKanadeMessageGrowth").textContent = growthMessages[0];
    $("#deckKanadeMessageShop").textContent = shopMessages[0];
    if (kanade.image) $("#deckKanadeImageGrowth").src = kanade.image;
  }

  function renderGrowth(overview, growth) {
    const cards = [
      ["DECK OVERVIEW", overview.summary || "このデッキの概要はまだ未登録。", overview.concept || ""],
      ["現在の段階", overview.stage || "育成中", ""],
      ["このデッキらしさ", overview.identity || "調整中", overview.identityNote || ""]
    ];

    $("#growthOverview").innerHTML = cards.map(([label, title, text], index) => `
      <article class="growth-card ${index === 0 ? "wide" : ""}">
        <div class="growth-label">${escapeHtml(label)}</div>
        <div class="growth-title">${escapeHtml(title)}</div>
        ${text ? `<div class="growth-text">${escapeHtml(text)}</div>` : ""}
      </article>
    `).join("");

    const checks = growth.checkItems || [];
    $("#growthChecks").innerHTML = checks.length
      ? checks.map(item => `<button class="check-btn" type="button" data-check-id="${escapeAttr(item.id)}">${escapeHtml(item.label)}</button>`).join("")
      : `<div class="growth-text">チェック項目はまだ登録されていません。</div>`;

    const memo = $("#growthMemo");
    memo.placeholder = growth.memoPlaceholder || "採用候補、気になった動き、次に試したいことを書いておこう。";
    memo.value = loadText(memoKey(), "");

    const savedChecks = loadJson(checkKey(), []);
    $$(".check-btn").forEach(button => {
      button.classList.toggle("active", savedChecks.includes(button.dataset.checkId));
    });
  }

  function renderSections() {
    const container = $("#deckSections");
    container.innerHTML = "";

    for (const section of state.deck.sections || []) {
      if (!section.cards?.length) continue;
      const wrapper = document.createElement("section");
      wrapper.className = "deck-section";
      wrapper.dataset.sectionId = section.id;
      wrapper.innerHTML = `<h2>${escapeHtml(section.title)} <span class="qty">${sumQty(section.cards)}枚</span></h2><div class="list"></div>`;
      const list = $(".list", wrapper);
      section.cards.forEach(card => list.appendChild(createCard(card)));
      container.appendChild(wrapper);
    }
  }

  function createCard(card) {
    const article = document.createElement("article");
    article.className = "card";
    article.dataset.cardId = card.id || `${card.en}-${card.jp}`;
    article.dataset.search = `${card.jp || ""} ${card.en || ""}`.toLowerCase();

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "check";
    check.setAttribute("aria-label", `${card.jp || card.en}を購入済みにする`);

    const priority = document.createElement("button");
    priority.type = "button";
    priority.className = "priority";
    priority.setAttribute("aria-label", `${card.jp || card.en}の優先度を変更`);
    priority.dataset.priority = String(card.priority ?? 0);
    priority.textContent = priorityIcon(Number(priority.dataset.priority));

    const names = document.createElement("div");
    names.className = "names";
    names.innerHTML = `
      <span class="jp">${escapeHtml(card.jp || card.en || "名称未登録")}<span class="qty">×${Number(card.qty || 1)}</span></span>
      ${card.en && card.en !== card.jp ? `<span class="en">${escapeHtml(card.en)}</span>` : ""}
    `;

    article.append(check, priority, names);
    return article;
  }

  function bindEvents() {
    $$(".mode-tab").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

    $("#deckSections").addEventListener("change", event => {
      if (!event.target.classList.contains("check")) return;
      const card = event.target.closest(".card");
      card.classList.toggle("done", event.target.checked);
      saveCardState();
      updateProgress();
    });

    $("#deckSections").addEventListener("click", event => {
      const button = event.target.closest(".priority");
      if (!button) return;
      const next = (Number(button.dataset.priority) + 1) % 3;
      button.dataset.priority = String(next);
      button.textContent = priorityIcon(next);
      saveCardState();
    });

    $("#search").addEventListener("input", filterCards);
    $("#copyDeck").addEventListener("click", copyDeckList);
    $("#randomLine").addEventListener("click", randomShopMessage);
    $("#saveGrowthMemo").addEventListener("click", saveGrowthMemo);

    $("#growthChecks").addEventListener("click", event => {
      const button = event.target.closest(".check-btn");
      if (!button) return;
      button.classList.toggle("active");
      saveChecks();
    });
  }

  function setMode(mode) {
    state.mode = mode === "growth" ? "growth" : "shop";
    saveText(modeKey(), state.mode);
    $$(".mode-tab").forEach(tab => {
      const active = tab.dataset.mode === state.mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    $$(".mode-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === state.mode));
  }

  function filterCards() {
    const query = $("#search").value.trim().toLowerCase();
    $$(".card").forEach(card => card.classList.toggle("hidden", query && !card.dataset.search.includes(query)));
    $$(".deck-section").forEach(section => {
      const visible = $$(".card:not(.hidden)", section).length;
      section.hidden = visible === 0;
    });
  }

  function restoreCardState() {
    const saved = loadJson(cardKey(), {});
    $$(".card").forEach(card => {
      const cardState = saved[card.dataset.cardId];
      const sourceCard = state.cards.find(item => (item.id || `${item.en}-${item.jp}`) === card.dataset.cardId);
      const check = $(".check", card);
      const priority = $(".priority", card);

      check.checked = cardState?.owned ?? Boolean(sourceCard?.owned);
      card.classList.toggle("done", check.checked);
      const level = cardState?.priority ?? Number(sourceCard?.priority || 0);
      priority.dataset.priority = String(level);
      priority.textContent = priorityIcon(level);
    });
  }

  function saveCardState() {
    const saved = {};
    $$(".card").forEach(card => {
      saved[card.dataset.cardId] = {
        owned: $(".check", card).checked,
        priority: Number($(".priority", card).dataset.priority)
      };
    });
    saveJson(cardKey(), saved);
  }

  function updateProgress() {
    const total = totalQty();
    let owned = 0;
    $$(".card").forEach(card => {
      if (!$(".check", card).checked) return;
      const source = state.cards.find(item => (item.id || `${item.en}-${item.jp}`) === card.dataset.cardId);
      owned += Number(source?.qty || 1);
    });
    $("#progressText").textContent = `${owned} / ${total}`;
    $("#fill").style.width = `${total ? Math.min(100, owned / total * 100) : 0}%`;
  }

  async function copyDeckList() {
    const text = state.cards.map(card => `${card.qty || 1} ${card.en || card.jp}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("デッキリストをコピーしたよ！");
    } catch {
      toast("コピーできませんでした。HTTPS上で試してね。");
    }
  }

  function randomShopMessage() {
    const lines = state.deck.kanade?.shoppingMessages || ["「購入リスト、チェックしてこ！」"];
    $("#deckKanadeMessageShop").textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  function saveGrowthMemo() {
    saveText(memoKey(), $("#growthMemo").value);
    $("#growthSaved").textContent = "保存したよ！";
    setTimeout(() => $("#growthSaved").textContent = "", 1600);
  }

  function saveChecks() {
    const active = $$(".check-btn.active").map(button => button.dataset.checkId);
    saveJson(checkKey(), active);
  }

  function totalQty() {
    return state.cards.reduce((sum, card) => sum + Number(card.qty || 1), 0);
  }

  function sumQty(cards) {
    return cards.reduce((sum, card) => sum + Number(card.qty || 1), 0);
  }

  function priorityIcon(level) {
    return ["○", "⭐", "🔥"][Number(level) || 0];
  }

  function cardKey() { return `mtg-manager:v4:${state.deckId}:cards`; }
  function memoKey() { return `mtg-manager:v4:${state.deckId}:memo`; }
  function checkKey() { return `mtg-manager:v4:${state.deckId}:checks`; }
  function modeKey() { return `mtg-manager:v4:${state.deckId}:mode`; }

  function loadText(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }
  function saveText(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function toast(message) {
    const box = $("#toast");
    box.textContent = message;
    box.style.display = "block";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.style.display = "none", 1800);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
