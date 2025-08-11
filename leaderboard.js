(function (global) {
  const LEADERBOARD_KEY = "snakeLeaderboard";
  const PLAYER_NAME_KEY = "snakePlayerName";

  function sanitizeEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .filter(
        (e) => e && typeof e.name === "string" && typeof e.score === "number"
      )
      .map((e) => ({ name: String(e.name).slice(0, 50), score: Number(e.score) }));
  }

  function getLeaderboard() {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const clean = sanitizeEntries(parsed);
      clean.sort((a, b) => b.score - a.score);
      return clean.slice(0, 5);
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(entries) {
    const clean = sanitizeEntries(entries);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(clean.slice(0, 5)));
  }

  function addScore(name, score) {
    if (typeof score !== "number" || score <= 0) return getLeaderboard();
    const safeName = (name && String(name).trim()) || "Player";
    const list = getLeaderboard();
    list.push({ name: safeName, score });
    list.sort((a, b) => b.score - a.score);
    saveLeaderboard(list);
    return getLeaderboard();
  }

  function resetLeaderboard() {
    localStorage.removeItem(LEADERBOARD_KEY);
  }

  function getSavedName() {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setSavedName(name) {
    try {
      if (typeof name === "string") {
        localStorage.setItem(PLAYER_NAME_KEY, name);
      }
    } catch (e) {}
  }

  global.Leaderboard = {
    getLeaderboard,
    addScore,
    resetLeaderboard,
    getSavedName,
    setSavedName,
  };
})(window);


