export function weeklyGoalOptions(game) {
  const year = Math.min(5, Math.ceil((game.week || 1) / 52));
  const labels = {
    1: ["累積新人實力", "站穩工作步調", "留一點生活空間"],
    2: ["磨出作品方向", "建立穩定曝光", "照顧重要關係"],
    3: ["準備代表作", "經營市場位置", "在忙碌中留白"],
    4: ["為轉型做準備", "延續商業合作", "重整生活步調"],
    5: ["打磨最後的作品", "完成職涯承諾", "把時間留給生活"],
  }[year];
  const options = [
    {
      id: "balanced",
      label: "照自己的步調",
      desc: "沿用彈性活動組合",
      rep: "業界評價",
    },
    {
      id: "craft",
      label: labels[0],
      desc:
        year === 1
          ? "訓練 2 天＋職涯活動 1 天"
          : "訓練 1 天＋正式通告／創作／續作 2 天",
      rep: "業界評價",
    },
    {
      id: "market",
      label: labels[1],
      desc: year === 1 ? "職涯活動 3 天" : "職涯活動 2 天＋社群更新 1 天",
      rep: "商業價值",
    },
    {
      id: "life",
      label: labels[2],
      desc: "職涯活動 1 天＋生活／休息 3 天",
      rep: "可信度",
    },
  ];
  if (year === 3)
    options.push({
      id: "team",
      label: "磨合合作班底",
      desc: "製作 1 天＋人物相處／合作 1 天",
      rep: "業界評價",
    });
  if (year === 4)
    options.push({
      id: "rebalance",
      label: "為轉型留餘裕",
      desc: "訓練 1 天＋職涯活動 1 天＋生活／休息 2 天",
      rep: "可信度",
    });
  if (year === 5)
    options.push({
      id: "legacy",
      label: "作品與重要的人",
      desc: "製作 1 天＋人物相處／合作 1 天＋生活／休息 2 天",
      rep: "業界評價",
    });
  return options;
}
export function currentWeeklyGoal(game) {
  return (
    weeklyGoalOptions(game).find(
      (g) =>
        g.id ===
        (game.weeklyGoal?.week === game.week ? game.weeklyGoal.id : "balanced"),
    ) || weeklyGoalOptions(game)[0]
  );
}
export function goalReady(game, counts) {
  const goal = currentWeeklyGoal(game);
  if (goal.id === "balanced") return null;
  if (goal.id === "team")
    return counts.production >= 1 && counts.connection >= 1;
  if (goal.id === "rebalance")
    return counts.train >= 1 && counts.work >= 1 && counts.life >= 2;
  if (goal.id === "legacy")
    return counts.production >= 1 && counts.connection >= 1 && counts.life >= 2;
  if (goal.id === "life") return counts.work >= 1 && counts.life >= 3;
  if (goal.id === "market")
    return game.week <= 52
      ? counts.work >= 3
      : counts.work >= 2 && counts.publicity >= 1;
  return game.week <= 52
    ? counts.train >= 2 && counts.work >= 1
    : counts.train >= 1 && counts.production >= 2;
}
export function selectWeeklyGoal(game, id) {
  if (
    game.week < 9 ||
    game.endingResult ||
    game.forcedRestWeek === game.week ||
    game.weekResults?.length ||
    game.weeklyTaskHistory?.some((x) => x.week === game.week && x.met)
  )
    return {
      ok: false,
      message: "本週已開始或仍在新人引導期；下週開始前再選重心。",
    };
  if (!weeklyGoalOptions(game).some((g) => g.id === id))
    return { ok: false, message: "沒有這項週目標。" };
  game.weeklyGoal = { week: game.week, id };
  return { ok: true, message: "已選擇本週重心，開始行動後不再變更。" };
}
