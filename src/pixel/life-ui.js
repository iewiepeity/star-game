import { ACTIONS } from "../data/actions.js";
import {
  CHOICES,
  DAY_NAMES,
  SPEEDS,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
  planDay,
  access,
  costOf,
  newProject,
  buyOutfit,
  recordMeeting,
} from "./life.js";
import { CREATIVE_TYPES } from "../logic/creative.js";
import { ROOMS, PEOPLE, outfits } from "./data.js";
import { OUTFITS } from "../data/wardrobe.js";
import { hasVisited } from "../logic/city-progression.js";
import { OFFICIAL_SOCIAL_POSTS, NPC_SOCIAL_COPY } from "../data/social.js";
export function createLifeUI(api) {
  const { show, heading, escape, checkpoint, toast, leaveOverlay } = api;
  const state = () => api.state(),
    life = () => state().life,
    world = () => api.world();
  const money = (n) => `$${n.toLocaleString()}`;
  let selectedDay = 0,
    autoWait = 0;
  const label = (a) =>
    a?.id === "creative"
      ? `創作・${life().game.creativeProjects.find((p) => p.id === a.projectId)?.title || "選一份作品"}`
      : CHOICES[a?.id]?.label || "未安排";
  const buttons = () =>
    `<div class="panel-actions"><button data-ui="menu">◀ 選單</button><button class="primary" data-ui="close">回到場景</button></div>`;
  const row = (title, note, attributes = "", right = "→") =>
    `<button class="command-row" ${attributes}><span><strong>${escape(title)}</strong>${note ? `<small>${escape(note)}</small>` : ""}</span><b>${right}</b></button>`;
  function changed() {
    const l = life(),
      g = l.game,
      p = l.pending;
    document.getElementById("date-label").textContent =
      `第 ${Math.floor((g.week - 1) / 52) + 1} 年 · ${((g.week - 1) % 52) + 1} 週`;
    document.getElementById("day-label").textContent =
      DAY_NAMES[l.day] || "週末回顧";
    document.getElementById("money-label").textContent = money(g.money);
    document.getElementById("energy-label").textContent = `體力 ${g.stamina}`;
    document.getElementById("fatigue-label").textContent = `疲勞 ${g.fatigue}`;
    document.getElementById("mood-label").textContent = `心情 ${g.mood}`;
    document.getElementById("today-label").textContent = p
      ? `${p.phase === "result" ? "完成" : "進行中"} · ${label(p.assignment)}`
      : l.day === 7
        ? "七天的努力，整理成一週的回憶。"
        : `今日 · ${label(l.plan[l.day])}`;
    document.getElementById("speed-label").textContent = `${l.speed}×`;
    document.getElementById("run-label").textContent =
      p?.phase === "result"
        ? "查看成果"
        : l.day === 7
          ? "本週回顧"
          : p
            ? "繼續行動"
            : "今日行動";
    document.getElementById("auto-control").textContent = l.auto
      ? "Ⅱ 接手操作"
      : "▷ 自動行程";
    if (p?.phase === "performing")
      document.getElementById("activity-label").textContent = label(
        p.assignment,
      );
  }
  function schedule(day = selectedDay) {
    const l = life();
    selectedDay = Math.max(l.day, Math.min(6, day));
    if (l.day === 7) return summary();
    const selected = l.plan[selectedDay];
    const estimate = l.plan
      .slice(l.day)
      .reduce((sum, a) => sum + costOf(l, a), 0);
    const cards = Object.entries(CHOICES)
      .map(([id, d]) => {
        const a =
          id === "creative"
            ? {
                id,
                projectId: l.game.creativeProjects.find(
                  (p) => p.status === "draft",
                )?.id,
              }
            : { id };
        const reason = access(l, a, selectedDay, true),
          locked = !!reason;
        return row(
          d.label,
          reason || `${d.group} · ${ROOMS[d.room].name}`,
          `data-plan="${id}" ${a.projectId ? `data-project="${a.projectId}"` : ""} ${locked ? "disabled" : ""} aria-pressed="${selected.id === id}"`,
          costOf(l, a) ? money(costOf(l, a)) : "—",
        );
      })
      .join("");
    show(
      "schedule",
      `${heading("WEEKLY PLAN", "我的一週", "每天一件重要的事。先探訪、再報名，空下來的日子留給自己。")}<div class="week-strip" role="group" aria-label="七日行程">${l.plan.map((a, i) => `<button data-day="${i}" class="${i === selectedDay ? "selected" : ""}" ${i < l.day ? "disabled" : ""}><small>週${"一二三四五六日"[i]}</small><strong>${escape(label(a))}</strong><span>${i < l.day ? "已完成" : i === l.day ? "今天" : "可調整"}</span></button>`).join("")}</div><div class="section-heading"><b>安排 ${DAY_NAMES[selectedDay]}</b><span>餘下學費／外出費 ${money(estimate)}</span></div><div class="action-catalog">${cards}</div><div class="panel-actions"><button data-ui="menu">◀ 選單</button><button data-life="auto" ${l.pending ? "disabled" : ""}>自動執行行程</button><button class="primary" data-life="today">開始今天 →</button></div>`,
    );
  }
  function offer(assignment) {
    const l = life();
    if (l.day === 7) return summary();
    if (l.pending) return today();
    const d = CHOICES[assignment.id],
      reason = access(l, assignment);
    show(
      "action",
      `${heading("TODAY", label(assignment), reason || "確認後，這件事會佔用今天的主要行程。")}<div class="action-detail"><img src="assets/pixel/${d.room}.png" alt="${ROOMS[d.room].name}"><div><b>${ROOMS[d.room].name}</b><p>${costOf(l, assignment) ? `花費 ${money(costOf(l, assignment))}` : "不需費用"} · 1 天</p><small>${assignment.id === "rest" ? "體力 +24 · 疲勞 −18" : d.group === "訓練" ? "課程效果依當日身體狀態調整" : d.group === "工作" ? `收入 $${ACTIONS[d.action].income[0].toLocaleString()}～$${ACTIONS[d.action].income[1].toLocaleString()} · 疲勞 +${ACTIONS[d.action].fatigue}` : assignment.id === "creative" ? "疲勞 +6 · 同一週可安排多天創作" : "完成後在日誌留下今日成果"}</small></div></div><div class="panel-actions"><button data-ui="close">再想一下</button><button class="primary" data-start="${assignment.id}" ${assignment.projectId ? `data-project="${escape(assignment.projectId)}"` : ""} ${reason ? "disabled" : ""}>確認今天的安排</button></div>`,
    );
  }
  function run(assignment, auto = false) {
    const l = life();
    const p = beginDay(l, assignment);
    if (p?.error) {
      l.auto = false;
      toast(p.error);
      schedule(l.day);
      return;
    }
    l.auto = auto;
    checkpoint();
    dispatch();
  }
  function dispatch() {
    const p = life().pending;
    if (!p) return;
    if (p.phase === "result") return result();
    const def = CHOICES[p.assignment.id];
    leaveOverlay();
    p.phase = "travel";
    const arrive = () => world().interact(def.item);
    if (state().sceneId !== def.room) world().transition(def.room, arrive);
    else arrive();
    checkpoint();
    changed();
  }
  function startPose(choice = "focus") {
    const p = life().pending,
      d = CHOICES[p.assignment.id];
    p.assignment.choice = choice;
    p.phase = "performing";
    leaveOverlay();
    if (!world().startActivity(d.item, d.pose)) {
      p.phase = "travel";
      life().auto = false;
      toast("先走到活動物件旁邊再繼續");
    }
    checkpoint();
    changed();
  }
  function interact(item) {
    const p = life().pending,
      d = p && CHOICES[p.assignment.id];
    if (
      p &&
      p.phase !== "result" &&
      d.room === state().sceneId &&
      d.item === item.id
    ) {
      if (d.venue && !p.assignment.choice) {
        life().auto = false;
        p.phase = "choice";
        checkpoint();
        show(
          "visit",
          `${heading("FIRST STEPS", d.label, "已走到現場。今天想怎麼認識這裡？")}<div class="command-list">${row("了解場地與服務", "詢問報名、記下工作與課程資訊", 'data-visit="focus"')}${row("留意身邊的人", "了解服務，也為接下來的相遇留點空間", 'data-visit="explore"')}</div><p class="tiny-note">完成這次自由活動後才會開放相關安排。選擇時自動行程暫停。</p>${buttons()}`,
        );
      } else startPose(p.assignment.choice);
      return true;
    }
    if (p && p.phase !== "result") {
      life().auto = false;
      p.phase = "travel";
    }
    const room = state().sceneId;
    if (room === "tv") {
      if (item.id === "reception") {
        offer({ id: "visit_tv" });
        return true;
      }
      if (item.id === "props") {
        offer({ id: "tv_assistant" });
        return true;
      }
    }
    if (room === "shop" && item.id !== "door") {
      shop();
      return true;
    }
    if (room === "rehearsal" && item.id === "notice") {
      offer({ id: "visit_rehearsal" });
      return true;
    }
    if (room === "rehearsal" && item.id === "practice") {
      show(
        "practice",
        `${heading("REHEARSAL", "鏡前練習", "正式課程佔一天；試做動作不增加能力。")}<div class="command-list">${row("報名表演課", `到訪後開放 · 目前學費 ${money(costOf(life(), { id: "acting" }))}`, 'data-offer="acting"')}${row("先試一段舞步", "放鬆暖身，不結算養成數值", 'data-activity="dance" data-item="practice"')}${row("先試著朗讀", "找找台詞的節奏", 'data-activity="read" data-item="practice"')}</div>${buttons()}`,
      );
      return true;
    }
    if (room === "home" && item.id === "bed") {
      show(
        "bed",
        `${heading("AT HOME", "好好睡一覺")}<div class="command-list">${row("用今天充分休息", "體力 +24 · 疲勞 −18", 'data-offer="rest"')}${row("只是躺一下", "不消耗天數、不改變數值", 'data-activity="rest" data-item="bed"')}</div>${buttons()}`,
      );
      return true;
    }
    return false;
  }
  function today() {
    const l = life();
    if (l.day === 7) return summary();
    if (l.pending?.phase === "result") return result();
    if (l.pending) return dispatch();
    offer(l.plan[l.day]);
  }
  function activityDone(kind, itemId) {
    const l = life();
    if (l.pending?.phase !== "performing") return false;
    const def = CHOICES[l.pending.assignment.id];
    if (
      def.pose !== kind ||
      def.item !== itemId ||
      def.room !== state().sceneId
    )
      return false;
    const r = settleDay(l, l.pending.assignment.choice);
    if (r?.error) {
      l.pending.phase = "travel";
      l.auto = false;
      toast(r.error);
      return true;
    }
    checkpoint();
    changed();
    autoWait = 0;
    if (l.auto)
      toast(
        `${r.label}完成 · ${r.deltas.money ? `收支 ${money(r.deltas.money)}` : "留下了一點進步"}`,
      );
    else result();
    return true;
  }
  const statLabels = {
    money: "收支",
    stamina: "體力",
    fatigue: "疲勞",
    mood: "心情",
    health: "健康",
    fame: "知名度",
    fans: "粉絲",
  };
  function result() {
    const r = life().pending?.result;
    if (!r) return;
    show(
      "result",
      `${heading("A DAY TO REMEMBER", `${DAY_NAMES[r.day]} · ${r.label}`)}<div class="result-scene"><img src="assets/pixel/${CHOICES[r.assignment.id].room}.png" alt="今天的活動場景"><span>今日完成</span></div><div class="result-values">${Object.entries(
        r.deltas,
      )
        .filter(([, v]) => v)
        .map(
          ([key, v]) =>
            `<div><small>${statLabels[key]}</small><b>${v > 0 ? "+" : ""}${key === "money" ? money(v) : v}</b></div>`,
        )
        .join(
          "",
        )}${r.gains.map((g) => `<div><small>${g.name}</small><b>+${g.amount}</b></div>`).join("")}</div>${r.notes.map((n) => `<p class="result-note">${escape(n)}</p>`).join("")}<div class="panel-actions"><button data-ui="saves">保存今天</button><button class="primary" data-life="advance">${life().day === 6 ? "看看這一週" : "迎接明天 →"}</button></div>`,
    );
  }
  function advance() {
    const l = life();
    if (!advanceDay(l)) return;
    checkpoint();
    changed();
    if (l.day === 7) summary();
    else if (l.auto) run(l.plan[l.day], true);
    else {
      leaveOverlay();
      toast(`${DAY_NAMES[l.day]}，新的一天。`);
    }
  }
  function summary() {
    const r = life().weekSummary;
    if (!r) return;
    const net =
      r.results.reduce((s, r) => s + r.deltas.money, 0) + r.reward.money;
    show(
      "summary",
      `${heading("WEEK IN REVIEW", `第 ${r.week} 週 · 我的成長`)}<div class="week-reward"><span>本週淨收支</span><strong>${net > 0 ? "+" : ""}${money(net)}</strong><small>${r.reward.met ? `達成${r.reward.orientation ? "新人安頓" : "每週養成"}任務 · 補助 ${money(r.reward.money)}` : "下週再試：探訪／訓練、工作與適當休息"}</small></div><ol class="week-history">${r.results.map((r) => `<li><small>週${"一二三四五六日"[r.day]}</small><b>${escape(r.label)}</b><span>${r.deltas.money ? money(r.deltas.money) : "—"}</span></li>`).join("")}</ol><div class="panel-actions"><button data-ui="saves">存檔</button><button class="primary" data-life="next-week">開始下一週 →</button></div>`,
    );
  }
  function creative() {
    const projects = life().game.creativeProjects;
    show(
      "creative",
      `${heading("MY STUDIO", "創作筆記", "一個想法，慢慢成為自己的作品。創作可排入每個尚未使用的日子。")}<form id="project-form"><div class="project-fields"><label>作品類型<select id="project-type">${Object.entries(
        CREATIVE_TYPES,
      )
        .map(([id, v]) => `<option value="${id}">${v.label}</option>`)
        .join(
          "",
        )}</select></label><label>作品名稱<input id="project-title" maxlength="40" placeholder="給這個靈感一個名字" required></label><button class="primary" type="submit">建立草稿</button></div></form><div class="project-list">${projects.length ? projects.map((p) => `<article><div class="section-heading"><strong>${escape(p.title)}</strong><small>${CREATIVE_TYPES[p.type].label}</small></div><progress max="100" value="${p.progress}" aria-label="作品完成度"></progress><div class="section-heading"><small>${p.progress}% · 品質 ${p.quality}</small><button data-offer="creative" data-project="${escape(p.id)}" ${p.status === "ready" ? "disabled" : ""}>${p.status === "ready" ? "草稿完成" : "今天繼續寫"}</button></div></article>`).join("") : '<p class="empty-note">還沒有作品。先記下一個你想說的故事。</p>'}</div>${buttons()}`,
    );
    document.getElementById("project-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const p = newProject(
        life(),
        document.getElementById("project-type").value,
        document.getElementById("project-title").value,
      );
      if (p) {
        checkpoint();
        creative();
        toast("草稿建立好了，安排一天把想法寫下來。");
      }
    });
  }
  function phone(tab = "feed") {
    const l = life();
    const contacts = state().knownPeople;
    const posts = [
      ...l.game.socialPosts.map((p) => ({ ...p, name: state().playerName })),
      ...contacts.map((id) => ({
        id,
        name: PEOPLE[id].name,
        text: NPC_SOCIAL_COPY[id],
        likes: 12,
        comments: [],
      })),
      ...OFFICIAL_SOCIAL_POSTS,
    ];
    show(
      "phone",
      `${heading("STARGRAM", "我的手機")}<nav class="phone-tabs"><button data-phone="feed" aria-pressed="${tab === "feed"}">星語動態</button><button data-phone="contacts" aria-pressed="${tab === "contacts"}">聯絡人 ${contacts.length}</button></nav>${tab === "contacts" ? `<div class="contact-list">${contacts.length ? contacts.map((id) => `<article><img src="${PEOPLE[id].head}" alt=""><div><b>${PEOPLE[id].name}</b><small>${PEOPLE[id].job}</small><p>親近 ${l.game.relationships[id]?.closeness || 0} · 信任 ${l.game.relationships[id]?.trust || 0}</p></div></article>`).join("") : '<p class="empty-note">到場景和人物打招呼，交換聯絡方式後會出現在這裡。</p>'}</div>` : `<div class="section-heading"><span>粉絲 ${l.game.fans}</span><button data-offer="social">安排一天經營動態</button></div><div class="social-feed">${posts.map((p) => `<article><b>${escape(p.name)}</b><p>${escape(p.text)}</p><small>♡ ${p.likes} · ${p.comments.length} 則回應</small><details><summary>查看回應</summary>${p.comments.length ? p.comments.map((c) => `<p>${escape(typeof c === "string" ? c : `${c.name}：${c.text}`)}</p>`).join("") : "<p>還沒有回應</p>"}</details></article>`).join("")}</div>`}${buttons()}`,
    );
  }
  function shop() {
    const l = life(),
      visited = hasVisited(l.game, "shop");
    show(
      "shop",
      `${heading("STARLIGHT BOUTIQUE", "星光服飾店", visited ? "挑一件陪你走進下一個場景的衣服。" : "先花一天熟悉店內款式，再到櫃檯購買。")}${!visited ? row("認識服飾店", "自由活動 · $300 · 1 天", 'data-offer="visit_shop"') : ""}<div class="wardrobe-grid">${outfits
        .map(
          (o) =>
            `<article class="outfit-card"><img src="${o.portrait}" alt="${o.name}"><strong>${o.name}</strong><small>${Object.entries(
              OUTFITS[o.id].bonuses,
            )
              .map(([n, v]) => `${n}+${v}`)
              .join(
                " · ",
              )}</small><button data-buy="${o.id}" ${!visited || l.game.ownedOutfits.raven.includes(o.id) ? "disabled" : ""}>${l.game.ownedOutfits.raven.includes(o.id) ? "已擁有" : money(OUTFITS[o.id].price)}</button></article>`,
        )
        .join("")}</div>${buttons()}`,
    );
  }
  function meeting(id) {
    recordMeeting(life(), id);
    checkpoint();
  }
  function takeover() {
    const l = life();
    l.auto = false;
    if (l.pending && l.pending.phase !== "result") l.pending.phase = "travel";
    changed();
  }
  function tick(delta) {
    const l = life();
    if (!l.auto || api.paused() || document.hidden) return;
    if (l.pending?.phase === "result") {
      autoWait += delta * l.speed;
      if (autoWait >= 1.5) {
        autoWait = 0;
        advance();
      }
    }
  }
  function handle(target) {
    const d = target.dataset,
      l = life();
    if (d.day !== undefined) {
      schedule(Number(d.day));
      return true;
    }
    if (d.plan) {
      const reason = planDay(l, selectedDay, {
        id: d.plan,
        ...(d.project ? { projectId: d.project } : {}),
      });
      if (reason) toast(reason);
      checkpoint();
      schedule();
      return true;
    }
    if (d.offer) {
      offer({ id: d.offer, ...(d.project ? { projectId: d.project } : {}) });
      return true;
    }
    if (d.start) {
      run({ id: d.start, ...(d.project ? { projectId: d.project } : {}) });
      return true;
    }
    if (d.visit) {
      startPose(d.visit);
      return true;
    }
    if (d.buy) {
      const reason = buyOutfit(l, d.buy);
      checkpoint();
      changed();
      shop();
      toast(reason || "已放進衣櫃，回家就能換上。");
      return true;
    }
    if (d.phone) {
      phone(d.phone);
      return true;
    }
    if (!d.life) return false;
    if (d.life === "today") today();
    if (d.life === "advance") advance();
    if (d.life === "next-week") {
      nextWeek(l);
      checkpoint();
      changed();
      schedule(0);
    }
    if (d.life === "creative") creative();
    if (d.life === "speed") {
      l.speed = SPEEDS[(SPEEDS.indexOf(l.speed) + 1) % SPEEDS.length];
      checkpoint();
      changed();
    }
    if (d.life === "auto") {
      if (l.auto) {
        l.auto = false;
        checkpoint();
        changed();
        toast("已停止自動行程，目前動作完成後會等你。");
      } else if (l.day === 7) summary();
      else {
        l.auto = true;
        if (l.pending?.phase === "result") {
          leaveOverlay();
          autoWait = 0;
        } else run(l.plan[l.day], true);
      }
    }
    return true;
  }
  return {
    changed,
    schedule,
    phone,
    creative,
    interact,
    activityDone,
    today,
    meeting,
    tick,
    handle,
    takeover,
    shop,
  };
}
