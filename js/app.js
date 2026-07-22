(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      const data = await fetchJson("data/decks.json");
      renderAppInfo(data.app || {});
      renderDecks(data.decks || []);

      $("#loading").hidden = true;
      $("#deckGrid").hidden = false;
    } catch (error) {
      console.error(error);
      $("#loading").hidden = true;
      const box = $("#error");
      box.hidden = false;
      box.textContent =
        `デッキ一覧の読み込みに失敗しました。${error.message} ` +
        "GitHub Pages上で開いているか、data/decks.json の配置を確認してください。";
    }
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${path} を取得できませんでした（${response.status}）。`);
    }
    return response.json();
  }

  function renderAppInfo(app) {
    if (app.name) {
      $("#appTitle").textContent = app.name;
      document.title = app.name;
    }
    if (app.version) {
      $("#appVersion").textContent = `Ver.${app.version}`;
    }
  }

  function renderDecks(decks) {
    const grid = $("#deckGrid");
    grid.innerHTML = "";
    $("#deckCount").textContent = `${decks.length} decks`;

    if (!decks.length) {
      grid.innerHTML = `
        <div class="empty-state">
          まだデッキが登録されていません。<br>
          data/decks.json にデッキ情報を追加してね。
        </div>
      `;
      return;
    }

    decks.forEach((deck, index) => {
      grid.appendChild(createDeckCard(deck, index));
    });
  }

  function createDeckCard(deck, index) {
    const link = document.createElement("a");
    link.className = "deck-tile";
    link.href = `deck.html?id=${encodeURIComponent(deck.id)}`;
    link.style.setProperty("--delay", `${index * 55}ms`);

    const modeLabel = deck.defaultMode === "growth" ? "🌱 育成モード" : "🛒 ショップモード";
    const statusLabel = statusText(deck.status);

    link.innerHTML = `
      <div class="deck-tile-top">
        <span class="deck-symbol">${escapeHtml(deck.symbol || "🎴")}</span>
        <span class="deck-status">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="deck-tile-body">
        <div class="deck-format">${escapeHtml(deck.format || "Deck")}</div>
        <h3>${escapeHtml(deck.name || deck.pageTitle || deck.id)}</h3>
        <div class="deck-mode">${escapeHtml(modeLabel)}</div>
      </div>
      <div class="deck-tile-open">
        <span>デッキを開く</span>
        <span aria-hidden="true">›</span>
      </div>
    `;

    return link;
  }

  function statusText(status) {
    const labels = {
      growing: "育成中",
      complete: "完成",
      planning: "構築中",
      archived: "保管"
    };
    return labels[status] || "育成中";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }
})();
