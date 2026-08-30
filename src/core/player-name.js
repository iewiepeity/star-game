export function playerRealName(player) {
  const value = Object.prototype.hasOwnProperty.call(player || {}, "realName")
    ? player.realName
    : player?.name;
  return String(value || "").trim();
}

export function playerStageName(player) {
  return String(player?.stageName || "").trim();
}

export function playerPublicName(player) {
  return playerStageName(player) || playerRealName(player);
}

export function syncLegacyPlayerName(player) {
  player.realName = playerRealName(player);
  player.stageName = playerStageName(player);
  // `name` stays as the public-name alias for old content and save consumers.
  player.name = playerPublicName(player);
  return player.name;
}
