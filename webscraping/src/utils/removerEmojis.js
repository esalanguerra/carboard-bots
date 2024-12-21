function removerEmojis(text) {
  return text ? String(text).replace(/[\u{1F600}-\u{1F6FF}]/gu, "") : "";
}

module.exports = removerEmojis;
