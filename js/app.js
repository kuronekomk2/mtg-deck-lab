(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  let lastMessageIndex = -1;

  const homeMessages = {
    morning: [
      { image: "kanade_normal.png", text: "「おはよ、くーちゃん！ 朝の一枚、考えてこっか！」" },
      { image: "kanade_happy.png", text: "「朝からMTGとか、最高じゃん！」" },
      { image: "kanade_thinking.png", text: "「今日はどのデッキから見直す？」" }
    ],
    afternoon: [
      { image: "kanade_normal.png", text: "「くーちゃん、今日はどのデッキ育てる？」" },
      { image: "kanade_happy.png", text: "「開発室へおかえり！ 今日もMTGしよー！」" },
      { image: "kanade_shopping.png", text: "「カードショップ行くなら、購入リストも確認しとこ！」" },
      { image: "kanade_thinking.png", text: "「次に見直すなら、土地？ ドロー？ それとも勝ち筋かな？」" }
    ],
    evening: [
      { image: "kanade_happy.png", text: "「おつかれ、くーちゃん！ 夜はゆっくりデッキ会議しよ！」" },
      { image: "kanade_normal.png", text: "「今日の最後に、一枚だけでも見直してこっか。」" },
      { image: "kanade_thinking.png", text: "「夜って、妙に面白い構築案が浮かぶよね。」" }
    ],
    lateNight: [
      { image: "kanade_thinking.png", text: "「夜更かしデッキ開発会、開幕しちゃう？」" },
      { image: "kanade_normal.png", text: "「無理しすぎないでね。続きは明日でも大丈夫！」" },
      { image: "kanade_happy.png", text: "「深夜テンションの神アイデア、来るかも！」" }
    ],
    common: [
      { image: "kanade_normal.png", text: "「焦らず一枚ずつ、このデッキらしく育ててこ！」" },
      { image: "kanade_happy.png", text: "「新しいアイデア、なんか降りてきそうじゃない？」" },
      { image: "kanade_thinking.png", text: "「強いだけじゃなくて、“このデッキらしい”も大事だよね。」" },
      { image: "kanade_success.png", text: "「今日はどのデッキ育てる？ 開発室で作戦会議しよ！」" }
    ]
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupKanadeMessage();

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

  function setupKanadeMessage() {
    const button = $("#changeLine");
    if (button) button.addEventListener("click", changeKanadeMessage);
    changeKanadeMessage();
  }

  function getTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 24) return "evening";
    return "lateNight";
  }

  function changeKanadeMessage() {
    const image = $("#kanadeImage");
    const message = $("#kanadeMessage");
    if (!image || !message) return;

    const pool = [...homeMessages[getTimePeriod()], ...homeMessages.common];
    let index;
    do {
      index = Math.floor(Math.random() * pool.length);
    } while (pool.length > 1 && index === lastMessageIndex);

    lastMessageIndex = index;
    image.classList.remove("pop");
    void image.offsetWidth;
    image.src = pool[index].image;
    message.textContent = pool[index].text;
    image.classList.add("pop");
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${path} を取得できませんでした（${response.status}）。`);
    }
    return response.json();
  }

  function renderAppInfo(app) {
    if (app.name) document.title = app.name;
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
