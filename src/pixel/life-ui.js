import { npcSocialPost } from "../logic/social-context.js";
import {
  applyPlannerTool,
  plannerToolsMarkup,
  setWeeklyFocus,
  weeklyFocusMarkup,
} from "./planner-tools.js";
import { createCareerUI } from "./career-ui.js";
import { careerDecision } from "./career.js";
import { menuIcon } from "./menu-icons.js";
import { ACTIONS } from "../data/actions.js";
import {
  CHOICES,
  definition,
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
  cancelDay,
} from "./life.js";
import { CREATIVE_TYPES } from "../logic/creative.js";
import { ROOMS, PEOPLE, outfits } from "./data.js";
import { OUTFITS, portraitAsset } from "../data/wardrobe.js";
import { hasVisited } from "../logic/city-progression.js";
import { roomIllustration } from "./city-rooms.js";
import { CITY_CATALOG, hiddenRoomOpen } from "./city-catalog.js";
import { AGENCIES } from "../data/agencies.js";
import { OFFICIAL_SOCIAL_POSTS } from "../data/social.js";
import { explorationResultNotes } from "./location-day-copy.js";
export function createLifeUI(api) {
  const { show, heading, escape, checkpoint, toast, leaveOverlay } = api;
  const state = () => api.state(),
    life = () => state().life,
    world = () => api.world();
  const money = (n) => `$${n.toLocaleString()}`;
  let selectedDay = 0,
    autoWait = 0,
    filter = "全部";
  const label = (a) =>
    a?.id === "creative"
      ? `創作・${life().game.creativeProjects.find((p) => p.id === a.projectId)?.title || "選一份作品"}`
      : definition(life(), a)?.label || "未安排";
  const buttons = () =>
    `<div class="panel-actions"><button data-ui="menu">◀ 選單</button><button class="primary" data-ui="close">回到場景</button></div>`;
  const row = (title, note, attributes = "", right = "→") =>
    `<button class="command-row" ${attributes}><span><strong>${escape(title)}</strong>${note ? `<small>${escape(note)}</small>` : ""}</span><b>${right}</b></button>`;
  // Keep text nodes stable during a tap: WebKit cancels clicks when the
  // simulation tick replaces the pressed label between down and up.
  function hudText(id, value) {
    const node = document.getElementById(id);
    if (node.textContent !== value) node.textContent = value;
  }
  function changed() {
    const l = life(),
      g = l.game,
      p = l.pending;
    hudText("date-label", `第 ${Math.floor((g.week - 1) / 52) + 1} 年 · ${((g.week - 1) % 52) + 1} 週`);
    hudText("day-label", DAY_NAMES[l.day] || "週末回顧");
    hudText("money-label", money(g.money));
    hudText("energy-label", `體力 ${g.stamina}`);
    hudText("fatigue-label", `疲勞 ${g.fatigue}`);
    hudText("mood-label", `心情 ${g.mood}`);
    hudText("today-label", p
      ? `${p.phase === "result" ? "完成" : "進行中"} · ${label(p.assignment)}`
      : l.day === 7
        ? "七天的努力，整理成一週的回憶。"
        : `今日 · ${label(l.plan[l.day])}`);
    hudText("speed-label", `${l.speed}×`);
    hudText("run-label", p?.phase === "result"
        ? "查看成果"
        : l.day === 7
          ? "本週回顧"
          : p
            ? "繼續行動"
            : "今日行動");
    hudText("auto-control", l.auto
      ? "Ⅱ 接手操作"
      : "▷ 自動行程");
    if (p?.phase === "performing")
      hudText("activity-label", label(
        p.assignment,
      ));
  }
  function schedule(day = selectedDay) {
    const l = life();
    if (l.game.endingResult) return careerUI.ending();
    selectedDay = Math.max(l.day, Math.min(6, day));
    if (l.day === 7) return summary();
    const selected = l.plan[selectedDay];
    const estimate = l.plan
      .slice(l.day)
      .reduce((sum, a) => sum + costOf(l, a), 0);
    const cards = Object.entries(CHOICES)
      .filter(([id]) => !id.startsWith("career_"))
      .filter(([, d]) => filter === "全部" || d.group === filter)
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
          reason ||
            `${ROOMS[d.room].name}${!hasVisited(l.game, ROOMS[d.room].venue) && d.room !== "home" ? " · 含首次前往" : ""}`,
          `data-plan="${id}" ${a.projectId ? `data-project="${a.projectId}"` : ""} ${locked ? "disabled" : ""} aria-pressed="${selected.id === id}"`,
          costOf(l, a) ? money(costOf(l, a)) : "—",
        );
      })
      .join("");
    show(
      "schedule",
      `${heading("WEEKLY PLAN", "我的一週", "第一週就能自由改排。課程與工作會帶你前往場地，不需先花一天登記。")}${weeklyFocusMarkup(l)}${plannerToolsMarkup(l)}<div class="week-strip" role="group" aria-label="七日行程">${l.plan.map((a, i) => `<button data-day="${i}" class="${i === selectedDay ? "selected" : ""}" ${i < l.day ? "disabled" : ""}><small>週${"一二三四五六日"[i]}</small><strong>${escape(label(a))}</strong><span>${i < l.day ? "已完成" : i === l.day ? "今天" : "可調整"}</span></button>`).join("")}</div><div class="section-heading"><b>安排 ${DAY_NAMES[selectedDay]}</b><span>餘下學費／外出費 ${money(estimate)}</span></div><nav class="schedule-filters" aria-label="行程類型">${["全部", "訓練", "工作", "探訪", "生活", "創作", "休息"].map((f) => `<button data-schedule-filter="${f}" aria-pressed="${filter === f}">${f}</button>`).join("")}</nav><div class="action-catalog">${cards}</div><div class="panel-actions"><button data-ui="menu">◀ 選單</button><button data-life="auto" ${l.pending ? "disabled" : ""}>自動執行行程</button><button class="primary" data-life="today">開始今天 →</button></div>`,
    );
  }
  function offer(assignment) {
    const l = life();
    if (l.day === 7) return summary();
    if (l.pending?.phase === "result") return result();
    if (l.pending) {
      const error = cancelDay(l);
      if (error) {
        toast(error);
        return;
      }
      world().cancelActivity();
      world().stopRoute();
    }
    const d = definition(life(), assignment),
      reason = access(l, assignment);
    show(
      "action",
      `${heading("TODAY", label(assignment), reason || "確認後，這件事會佔用今天的主要行程。")}<div class="action-detail">${roomIllustration(ROOMS[d.room])}<div><b>${ROOMS[d.room].name}</b><p>${costOf(l, assignment) ? `花費 ${money(costOf(l, assignment))}` : "不需費用"} · 1 天</p><small>${assignment.id === "rest" ? "體力 +24 · 疲勞 −18" : d.group === "訓練" ? "課程效果依當日身體狀態調整" : d.group === "工作" && ACTIONS[d.action].income ? `收入 $${ACTIONS[d.action].income[0].toLocaleString()}～$${ACTIONS[d.action].income[1].toLocaleString()} · 疲勞 +${ACTIONS[d.action].fatigue}` : assignment.id === "creative" ? "疲勞 +6 · 同一週可安排多天創作" : "完成後在日誌留下今日成果"}</small></div></div><div class="panel-actions"><button data-ui="close">再想一下</button><button class="primary" data-start="${assignment.id}" ${assignment.projectId ? `data-project="${escape(assignment.projectId)}"` : ""} ${reason ? "disabled" : ""}>確認今天的安排</button></div>`,
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
    const def = definition(life(), p.assignment);
    leaveOverlay();
    p.phase = "travel";
    const arrive = () => {
      if (life().pending === p && p.phase === "travel") world().interact(def.item);
    };
    if (state().sceneId !== def.room) api.travelTo(def.room, arrive, true);
    else arrive();
    checkpoint();
    changed();
  }
  function startPose(choice = "focus") {
    const p = life().pending,
      d = definition(life(), p.assignment);
    p.assignment.choice = choice;
    p.phase = "performing";
    leaveOverlay();
    if (!world().startActivity(d.item, d.pose)) {
      p.phase = "travel";
      life().auto = false;
      toast("這個位置暫時無法演出此動作，請重新點選今日行動");
    }
    checkpoint();
    changed();
  }
  function interact(item) {
    const p = life().pending,
      d = p && definition(life(), p.assignment);
    if (
      p &&
      p.phase !== "result" &&
      d.room === state().sceneId &&
      d.item === item.id
    ) {
      if (!p.decisionMade) {
        const decision = p.decision || careerDecision(life(), p.assignment);
        if (decision) {
          p.decision = decision;
          p.phase = "decision";
          life().auto = false;
          checkpoint();
          showDecision();
          return true;
        }
      }
      startPose(p.assignment.choice || "focus");
      return true;
    }
    if (p && p.phase !== "result") {
      life().auto = false;
      p.phase = "travel";
    }
    const room = state().sceneId;
    if (room === "tv") {
      if (item.id === "reception") {
        services();
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
      services();
      return true;
    }
    if (room === "rehearsal" && item.id === "practice") {
      show(
        "practice",
        `${heading("REHEARSAL", "鏡前練習", "正式課程佔一天；試做動作不增加能力。")}<div class="command-list">${row("報名表演課", `可直接報名 · 目前學費 ${money(costOf(life(), { id: "acting" }))}`, 'data-offer="acting"')}${row("先試一段舞步", "暖身活動，不增加能力", 'data-activity="dance" data-item="practice"')}${row("先試著朗讀", "找找台詞的節奏", 'data-activity="read" data-item="practice"')}</div>${buttons()}`,
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
    if (item.action === "services") {
      services();
      return true;
    }
    return false;
  }
  function showDecision() {
    const d = life().pending?.decision;
    if (!d) return;
    api.narrate({
      title: d.title,
      text: d.text,
      portrait: d.portrait,
      choices: d.choices.map((c) => ({
        label: c.label,
        note: c.note,
        attrs: `data-career-decision="${escape(c.id)}"`,
      })),
    });
  }
  function today() {
    if (life().game.endingResult) return careerUI.ending();
    if (careerUI.hasStory()) {
      life().auto = false;
      return careerUI.stories();
    }
    if (life().pending?.phase === "decision") return showDecision();
    const l = life();
    if (l.day === 7) return summary();
    if (l.pending?.phase === "result") return result();
    if (l.pending) return dispatch();
    offer(l.plan[l.day]);
  }
  function activityDone(kind, itemId) {
    const l = life();
    if (l.pending?.phase !== "performing") return false;
    const def = definition(life(), l.pending.assignment);
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
    state().knownPeople = [
      ...new Set([...state().knownPeople, ...l.game.knownPeople]),
    ];
    if (r.presentation || careerUI.hasStory() || l.game.endingResult)
      l.auto = false;
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
    const notes = explorationResultNotes(r, CHOICES[r.assignment?.id]);
    if (r.presentation?.portrait)
      return api.narrate({
        title: r.presentation.title || r.label,
        context: r.presentation.context,
        text: [...notes, ...(r.moments || []).map(m => `${m.title}。${m.text} ${m.outcome}${m.effects.length ? `（${m.effects.join("、")}）` : ""}`)].join(" "),
        portrait: r.presentation.portrait,
        choices: [
          {
            label: life().day === 6 ? "看看這一週" : "迎接明天",
            attrs: 'data-life="advance"',
          },
        ],
      });
    show(
      "result",
      `${heading("A DAY TO REMEMBER", `${DAY_NAMES[r.day]} · ${r.label}`)}<div class="result-scene">${roomIllustration(ROOMS[definition(life(), r.assignment).room])}<span>今日完成</span></div><div class="result-values">${Object.entries(
        r.deltas,
      )
        .filter(([, v]) => v)
        .map(
          ([key, v]) =>
            `<div><small>${statLabels[key]}</small><b>${v > 0 ? "+" : ""}${key === "money" ? money(v) : v}</b></div>`,
        )
        .join(
          "",
        )}${r.gains.map((g) => `<div><small>${g.name}</small><b>+${g.amount}</b></div>`).join("")}</div>${notes.map((n) => `<p class="result-note">${escape(n)}</p>`).join("")}${(r.moments || []).map(m => `<article class="daily-moment"><span class="eyebrow">今日小記 · ${escape(m.kind)}</span><h3>${escape(m.title)}</h3><p>${escape(m.text)}</p><p class="moment-outcome">${escape(m.outcome)}</p>${m.effects.length ? `<small>${m.effects.map(escape).join(" · ")}</small>` : ""}</article>`).join("")}<div class="panel-actions">${r.presentation?.jobOfferId ? `<button data-job="${r.presentation.jobOfferId}">閱讀通告合約</button>` : ""}${r.presentation?.agencyOfferId ? `<button data-agency-info="${r.presentation.agencyOfferId}">閱讀經紀合約</button>` : ""}<button data-ui="saves">保存今天</button><button class="primary" data-life="advance">${life().day === 6 ? "看看這一週" : "迎接明天 →"}</button></div>`,
    );
  }
  function advance() {
    const l = life();
    if (!advanceDay(l)) return;
    checkpoint();
    changed();
    if (l.game.endingResult) careerUI.ending();
    else if (careerUI.hasStory()) {
      l.auto = false;
      careerUI.stories();
    } else if (l.day === 7) summary();
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
      `${heading("MY STUDIO", "創作筆記", "一個想法，慢慢成為自己的作品。創作可排入每個尚未使用的日子。")}<button data-pixel-app="creative">開啟完整創作工作室</button><form id="project-form" class="draft-form"><div class="project-fields"><label>作品類型<select id="project-type">${Object.entries(
        CREATIVE_TYPES,
      )
        .map(([id, v]) => `<option value="${id}">${v.label}</option>`)
        .join(
          "",
        )}</select></label><label>作品名稱<input id="project-title" maxlength="40" placeholder="給這個靈感一個名字" required></label><button class="primary" type="submit">建立草稿</button></div></form><div class="project-list">${projects.length ? projects.map((p) => `<article><div class="section-heading"><strong>${escape(p.title)}</strong><small>${CREATIVE_TYPES[p.type].label}</small></div><progress max="100" value="${p.progress}" aria-label="作品完成度"></progress><div class="section-heading"><small>${p.progress}% · 品質 ${p.quality}</small><button data-project-detail="${escape(p.id)}">製作與投稿</button><button data-offer="creative" data-project="${escape(p.id)}" ${["draft", "rejected"].includes(p.status) ? "" : "disabled"}>今天繼續寫</button></div></article>`).join("") : `<div class="draft-empty"><i>${menuIcon("creative")}</i><div><strong>第一份作品，從一個念頭開始</strong><p>選擇作品類型、取個名字，就能建立草稿。</p></div></div>`}</div>${buttons()}`,
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
        text: npcSocialPost(id, l.game)?.text || "今天先把近況記下來。",
        likes: 12,
        comments: [],
      })),
      ...(l.worldNews?.news || [])
        .filter((n) => n.title || n.text)
        .map((n, i) => ({
          id: `news-${i}`,
          name: n.title || "星望速報",
          text: n.text || n.summary || "",
          likes: 0,
          comments: [],
        })),
      ...OFFICIAL_SOCIAL_POSTS,
    ];
    show(
      "phone",
      `${heading("STARGRAM", "我的手機")}<nav class="phone-tabs"><button data-phone="feed" aria-pressed="${tab === "feed"}">星語動態</button><button data-phone="contacts" aria-pressed="${tab === "contacts"}">聯絡人 ${contacts.length}</button></nav>${tab === "contacts" ? `<div class="contact-list">${contacts.length ? contacts.map((id) => `<article><img src="${PEOPLE[id].head}" alt=""><div><b>${PEOPLE[id].name}</b><small>${PEOPLE[id].job}</small><p>親近 ${l.game.relationships[id]?.closeness || 0} · 信任 ${l.game.relationships[id]?.trust || 0}</p><button data-contact="${id}">聯絡／邀約</button></div></article>`).join("") : '<p class="empty-note">到場景和人物打招呼，交換聯絡方式後會出現在這裡。</p>'}</div>` : `<div class="section-heading"><span>粉絲 ${l.game.fans}</span><button data-offer="social">安排一天經營動態</button></div><div class="social-feed">${posts.map((p) => `<article><b>${escape(p.name)}</b><p>${escape(p.text)}</p><small>♡ ${p.likes} · ${p.comments.length} 則回應</small><details><summary>查看回應</summary>${p.comments.length ? p.comments.map((c) => `<p>${escape(typeof c === "string" ? c : `${c.name}：${c.text}`)}</p>`).join("") : "<p>還沒有回應</p>"}</details></article>`).join("")}</div>`}${buttons()}`,
    );
  }
  function shop() {
    const l = life(),
      avatar = state().avatarId;
    show(
      "shop",
      `${heading("STARLIGHT BOUTIQUE", "星光服飾店", "挑好就能購買，不用額外登記，也不消耗天數。")}<div class="wardrobe-grid">${outfits
        .map(
          (o) =>
            `<article class="outfit-card"><img src="${portraitAsset(avatar, o.id)}" alt="${o.name}"><strong>${o.name}</strong><small>${Object.entries(
              OUTFITS[o.id].bonuses,
            )
              .map(([n, v]) => `${n}+${v}`)
              .join(
                " · ",
              )}</small><button data-buy="${o.id}" ${l.game.ownedOutfits[avatar].includes(o.id) ? "disabled" : ""}>${l.game.ownedOutfits[avatar].includes(o.id) ? "已擁有" : money(OUTFITS[o.id].price)}</button>${l.game.ownedOutfits[avatar].includes(o.id) ? `<button data-outfit="${o.id}">${state().outfitId === o.id ? "穿著中" : "換上這套"}</button>` : ""}</article>`,
        )
        .join("")}</div>${buttons()}`,
    );
  }
  function services() {
    const room = state().sceneId;
    if (room.startsWith("agency_"))
      return careerUI.agency(room.replace("agency_", ""));
    const list = Object.entries(CHOICES).filter(([, d]) => d.room === room);
    const agency =
      room.startsWith("agency_") && AGENCIES[room.replace("agency_", "")];
    show(
      "services",
      `${heading("AT YOUR SERVICE", ROOMS[room].name, "服務已開放。選擇今天要做的事，或先看看資訊。")}<div class="command-list">${room === "clinic" ? row("性別變更服務", "變性手術與人物外型", 'data-ui="clinic"') : ""}${list.map(([id, d]) => row(d.label, `${d.group} · ${costOf(life(), { id }) ? money(costOf(life(), { id })) : "免費"} · 1 天`, `data-offer="${id}"`)).join("")}${["tv", "film_company", "record_company", "media_company"].includes(room) ? row("查看公開徵選與正式通告", "現場 Casting Desk", `data-board-venue="${ROOMS[room].venue}"`) : ""}${room === "business" ? row("搭電梯拜訪經紀公司", "四家公司的公開接待區", 'data-ui="agencies"') : ""}${room === "gallery" && hiddenRoomOpen(state()) ? row("前往深夜剪輯室", "熟悉的分鏡工作室", 'data-interior="editing_room"') : ""}</div>${agency ? `<p class="result-note">${escape(agency.description || agency.style || CITY_CATALOG[room].note)}</p><p class="tiny-note">這裡是公司公開接待區。先準備作品與履歷；能否面談與簽約，取決於公司的資格要求與審核。</p>` : ""}${buttons()}`,
    );
  }
  function meeting(id) {
    const result = recordMeeting(life(), id, state().sceneId);
    checkpoint();
    return result;
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
    if (careerUI.handle(target)) return true;
    const d = target.dataset,
      l = life();
    if (d.weeklyFocus) {
      const r = setWeeklyFocus(l, d.weeklyFocus);
      checkpoint();
      schedule();
      toast(r.message);
      return true;
    }
    if (d.plannerTool) {
      const r = applyPlannerTool(life(), d.plannerTool);
      checkpoint();
      changed();
      schedule();
      toast(r.message);
      return true;
    }
    if (d.careerDecision) {
      const p = l.pending;
      if (
        p?.phase === "decision" &&
        p.decision.choices.some((c) => c.id === d.careerDecision)
      ) {
        p.decisionMade = true;
        p.assignment.choice = d.careerDecision;
        startPose(d.careerDecision);
      }
      return true;
    }
    if (d.scheduleFilter) {
      filter = d.scheduleFilter;
      schedule();
      return true;
    }
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
      else {
        if (selectedDay === l.day) {
          world().cancelActivity();
          world().stopRoute();
        }
        toast(`${DAY_NAMES[selectedDay]}已改成${CHOICES[d.plan].label}`);
      }
      checkpoint();
      schedule();
      return true;
    }
    if (d.offer) {
      offer({ id: d.offer, ...(d.project ? { projectId: d.project } : {}) });
      return true;
    }
    if (d.start) {
      run(
        d.start.startsWith("career_")
          ? l.plan[l.day]
          : { id: d.start, ...(d.project ? { projectId: d.project } : {}) },
      );
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
      toast(reason || "已放進衣櫃，可以直接試穿換上。");
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
      if (l.game.endingResult) careerUI.ending();
      else if (careerUI.hasStory()) careerUI.stories();
      else schedule(0);
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
        autoWait = 0;
        api.cancelTravel?.();
        world().cancelActivity();
        world().stopRoute();
        const completed = l.pending?.phase === "result";
        if (!completed) cancelDay(l);
        leaveOverlay();
        checkpoint();
        changed();
        toast(completed
          ? "已停止自動行程，今天已完成的成果會保留。"
          : "已取消自動行程與今天尚未完成的動作，可以重新安排。");
        return true;
      }
      if (l.game.endingResult) {
        careerUI.ending();
        return true;
      }
      if (careerUI.hasStory()) {
        l.auto = false;
        careerUI.stories();
        return true;
      }
      if (l.day === 7) summary();
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
  const careerUI = createCareerUI({
    ...api,
    changed,
    schedule,
    phone,
    creative,
    afterStory: () =>
      life().day === 7
        ? summary()
        : life().pending?.phase === "result"
          ? result()
          : changed(),
  });
  function resumeNarrative() {
    if (life().game.activeEvent || life().game.eventOutcome) {
      careerUI.stories();
      return true;
    }
    if (life().pending?.phase === "decision") {
      showDecision();
      return true;
    }
    if (
      life().pending?.phase === "result" &&
      life().pending.result?.presentation?.portrait
    ) {
      result();
      return true;
    }
    return false;
  }
  return {
    resumeNarrative,
    career: careerUI,
    changed,
    shop,
    services,
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
  };
}
