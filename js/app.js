(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);

  const welcomeImages = [
    "kanade_normal.png",
    "kanade_happy.png",
    "kanade_thinking.png",
    "kanade_shopping.png",
    "kanade_success.png"
  ];

  const dailyGuidanceCards = [
    {
      id: "hope",
      image: "hope_mana_card.png",
      title: "希望のマナ",
      theme: "前向き",
      result: "明るい方へ",
      comment: "今日は少しだけ前向きな選択をしてみよう！小さな希望でも、ちゃんと次につながっていくよ♪"
    },
    {
      id: "growth",
      image: "growth_mana_card.png",
      title: "成長のマナ",
      theme: "積み重ね",
      result: "焦らず一歩ずつ",
      comment: "今日は焦らなくても大丈夫！昨日より少しだけ前へ進めたら十分だよ♪"
    },
    {
      id: "wisdom",
      image: "wisdom_mana_card.png",
      title: "知恵のマナ",
      theme: "冷静",
      result: "一度考えてみよう",
      comment: "今日は勢いよりも、少し立ち止まって考えるのが良さそう。落ち着けば、きっと答えが見えてくるよ♪"
    },
    {
      id: "passion",
      image: "passion_mana_card.png",
      title: "情熱のマナ",
      theme: "挑戦",
      result: "勢いを信じて",
      comment: "今日は気持ちが動いた方へ進んでみよう！やってみたいと思った瞬間が、始めどきかもしれないよ♪"
    },
    {
      id: "decision",
      image: "decision_mana_card.png",
      title: "決断のマナ",
      theme: "覚悟",
      result: "迷いを手放そう",
      comment: "今日は何かを決める日に向いていそう。完璧な答えじゃなくても、自分で選んだ一歩には意味があるよ♪"
    },
    {
      id: "freedom",
      image: "freedom_mana_card.png",
      title: "自由のマナ",
      theme: "柔軟",
      result: "型にとらわれず",
      comment: "今日はいつものやり方にこだわらなくても大丈夫。少し自由に考えると、新しい道が見つかるかも♪"
    },
    {
      id: "harmony",
      image: "harmony_mana_card.png",
      title: "協調のマナ",
      theme: "つながり",
      result: "力を合わせよう",
      comment: "今日は一人で抱え込まなくて大丈夫。誰かと話したり力を借りたりすると、いい流れが生まれそうだよ♪"
    }
  ];

  const messages = {
    morning: [
      "おはよう、くーちゃん！ 朝のひらめき、デッキに残しておこっか！",
      "今日もいい一日にしよ！ まずはお気に入りのデッキを見てみよう✨",
      "朝からデッキ開発、いいじゃん！ かなでも一緒に考えるよ！"
    ],
    afternoon: [
      "おつかれさま、くーちゃん！ ちょっとだけデッキを育てていこっか！",
      "今日はどのデッキに会いに行く？ かなで、楽しみにしてたよ！",
      "カード一枚の入れ替えでも立派な前進！ 焦らず育てようね。"
    ],
    evening: [
      "おかえり、くーちゃん！ 今日も一緒にデッキを育てようね！",
      "一日の終わりにデッキを眺める時間、かなでは結構好きだよ💜",
      "今日の対戦や一人回し、気付いたことがあったら残しておこう！"
    ],
    lateNight: [
      "夜更かしデッキ開発だね…！ 無理しすぎない範囲で楽しもう🌙",
      "静かな夜は構築が捗るけど、ちゃんと休憩もしてね、くーちゃん。",
      "あと一枚だけ考えたら今日はおしまい！ ……たぶんね？"
    ],
    common: [
      "ショップで見つけたいカード、優先度を確認しておこう！",
      "完成したデッキも、遊ぶたびにまた育っていくんだよね。",
      "迷った時はコンセプトに戻ろう。好きな動きが一番大事！",
      "くーちゃんのデッキ、今日も少しずつ強くしていこう！",
      "かなではいつでもここにいるよ。さて、どのデッキから見る？"
    ]
  };

  let lastMessage = "";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupWelcome();

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

  function setupWelcome() {
    showRandomWelcome();
    $("#heroWelcomeButton")?.addEventListener("click", showRandomWelcome);
    setupDailyGuidance();
  }

  function setupDailyGuidance() {
    const openButton = $("#dailyGuidanceButton");
    const modal = $("#dailyGuidanceModal");
    if (!openButton || !modal) return;

    let previouslyFocused = null;

    const closeModal = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      previouslyFocused?.focus();
    };

    const openModal = () => {
      previouslyFocused = document.activeElement;
      renderDailyGuidance(randomItem(dailyGuidanceCards), modal);
      modal.hidden = false;
      document.body.classList.add("modal-open");
      modal.querySelector(".guidance-modal__x")?.focus();
    };

    openButton.addEventListener("click", openModal);
    modal.querySelectorAll("[data-guidance-close]").forEach(node => {
      node.addEventListener("click", closeModal);
    });
    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });
  }

  function renderDailyGuidance(card, modal) {
    const image = $("#guidanceCardImage", modal);
    const name = $("#guidanceCardName", modal);
    const theme = $("#guidanceTheme", modal);
    const result = $("#guidanceResult", modal);
    const comment = $("#guidanceComment", modal);

    image.src = card.image;
    image.alt = `${card.title}のカード`;
    name.textContent = card.title;
    theme.textContent = card.theme;
    result.textContent = card.result;
    comment.textContent = card.comment;
    modal.dataset.cardId = card.id;
  }

  function showRandomWelcome() {
    const pool = [...messages[timePeriod()], ...messages.common];
    const candidates = pool.filter(message => message !== lastMessage);
    const message = randomItem(candidates.length ? candidates : pool);
    lastMessage = message;

    const messageNode = $("#welcomeMessage");
    const imageNode = $("#welcomeKanade");
    if (messageNode) messageNode.textContent = message;
    if (imageNode) {
      imageNode.classList.remove("welcome-pop");
      void imageNode.offsetWidth;
      imageNode.src = randomItem(welcomeImages);
      imageNode.classList.add("welcome-pop");
    }
  }

  function timePeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 24) return "evening";
    return "lateNight";
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
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
    if (app.version) $("#appVersion").textContent = `Ver.${app.version}`;
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

    decks.forEach((deck, index) => grid.appendChild(createDeckCard(deck, index)));
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
    const labels = { growing: "育成中", complete: "完成", planning: "構築中", archived: "保管" };
    return labels[status] || "育成中";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }
})();
