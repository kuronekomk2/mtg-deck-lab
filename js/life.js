(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const kanadeMessages = [
    "ナイスプレイ！",
    "その調子その調子♪",
    "落ち着いていこう！",
    "次の一手、どうする？",
    "まだまだ逆転できるよ！",
    "今日も楽しんでいこうね♪"
  ];

  const state = {
    mode: null,
    life: 0,
    commander: { a: 0, b: 0, c: 0 },
    lastMessage: "対戦開始！ 今日も楽しんでいこうね♪"
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.querySelectorAll("[data-life-mode]").forEach(button => {
      button.addEventListener("click", () => startMode(Number(button.dataset.lifeMode)));
    });

    document.querySelectorAll("[data-life-change]").forEach(button => {
      button.addEventListener("click", () => {
        state.life += Number(button.dataset.lifeChange);
        renderLife();
      });
    });

    document.querySelectorAll("[data-commander-change]").forEach(button => {
      button.addEventListener("click", () => changeCommander(button));
    });

    $("#lifeResetButton").addEventListener("click", resetCounter);
    $("#lifeKanadeButton").addEventListener("click", showRandomKanadeMessage);
  }

  function startMode(mode) {
    state.mode = mode;
    state.life = mode;
    state.commander = { a: 0, b: 0, c: 0 };

    $("#initialLife").textContent = mode;
    $("#lifeModeLabel").textContent = mode === 40 ? "40点・統率者戦" : "20点・通常対戦";
    $("#commanderSection").hidden = mode !== 40;
    $("#lifeModeSelect").hidden = true;
    $("#lifeCounter").hidden = false;
    renderAll();
    document.querySelector('[data-life-change="-1"]').focus();
  }

  function changeCommander(button) {
    const row = button.closest("[data-commander]");
    const opponent = row.dataset.commander;
    const change = Number(button.dataset.commanderChange);
    state.commander[opponent] = Math.max(0, state.commander[opponent] + change);
    renderCommanderRow(row, state.commander[opponent]);
  }

  function renderAll() {
    renderLife();
    document.querySelectorAll("[data-commander]").forEach(row => {
      renderCommanderRow(row, state.commander[row.dataset.commander]);
    });
  }

  function renderLife() {
    $("#lifeTotal").textContent = state.life;
  }

  function renderCommanderRow(row, value) {
    row.querySelector(".commander-total").textContent = value;
    row.classList.toggle("is-danger", value >= 21);
  }

  function resetCounter() {
    if (!window.confirm("ライフカウンターをリセットしますか？")) return;
    state.life = state.mode;
    state.commander = { a: 0, b: 0, c: 0 };
    renderAll();
  }

  function showRandomKanadeMessage() {
    const candidates = kanadeMessages.filter(message => message !== state.lastMessage);
    const message = candidates[Math.floor(Math.random() * candidates.length)];
    state.lastMessage = message;
    $("#lifeKanadeMessage").textContent = message;
  }
})();
