import { NPCS } from "../data/npcs.js";
import { OUTFITS } from "../data/wardrobe.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { ACTING_ROUNDS, REGULAR_PLACES } from "../data/city-life.js";
import { cityDay } from "../core/city-life-state.js";
import {
  cityLife,
  calendarOccasions,
  outfitDescription,
  regularOpportunity,
  adoptPet,
  comfortPet,
  petCarers,
  setPetCare,
  publishCityPhoto,
  withdrawCityPhoto,
} from "../logic/city-life.js";
import {
  bookCityAppointment,
  cancelCityAppointment,
  cityBookingProblem,
  cityEvent,
} from "./city-schedule.js";
import { withCore } from "./core-bridge.js";

export function createCityLifeUI(api) {
  const { show, heading, escape: esc, checkpoint, changed, toast } = api;
  const life = () => api.state().life,
    game = () => life().game,
    c = () => cityLife(game());
  let tab = "calendar",
    booking = null;
  const date = (day) =>
    `第 ${Math.floor(day / 364) + 1} 年・第 ${(Math.floor(day / 7) % 52) + 1} 週・週${"一二三四五六日"[day % 7]}`;
  const back =
    '<div class="panel-actions"><button data-ui="menu">◀ 選單</button><button data-ui="close">回到場景</button></div>';
  const button = (label, attrs, disabled = false) =>
    `<button ${attrs}${disabled ? " disabled" : ""}>${esc(label)}</button>`;
  function calendar() {
    const now = cityDay(game(), life().day),
      events = calendarOccasions(game(), now);
    return `<p>重要的日子可以前後一週補過。邀約占一天、聚會 $300，實際赴約才結算。日曆沿用每年 52 週；年末生日收於最後一天，2 月 29 日在 2 月 28 日慶祝。</p><div class="city-life-cards">${
      events
        .map((e) => {
          const existing = c().appointments.find(
            (a) =>
              a.eventId === e.id &&
              ["reserved", "completed"].includes(a.status),
          );
          return `<article><h3>${esc(e.title)}</h3><p>${date(e.due)}</p>${existing ? `<p>${existing.status === "completed" ? "已留下回憶" : `已約在${date(existing.day)}`}</p>` : button("邀請一起過", `data-city-invite="${esc(e.id)}"`)}</article>`;
        })
        .join("") ||
      "<p>最近沒有已知的重要日子，仍可以到家裡相處或一起練習。</p>"
    }</div><h3>我的約定</h3><div class="city-life-cards">${
      c()
        .appointments.slice()
        .reverse()
        .slice(0, 20)
        .map(
          (a) =>
            `<article><b>${esc(a.title)} · ${esc(NPCS[a.npcId].name)}</b><p>${date(a.day)}</p><p>${esc(a.text || (a.status === "reserved" ? "雙方已留好時間。" : a.status === "cancelled" ? "這次先取消。" : "這次未能成行。"))}</p>${a.status === "reserved" ? button("改期", `data-city-reschedule="${esc(a.id)}"`) + button("取消邀約", `data-city-cancel="${esc(a.id)}"`) : ""}</article>`,
        )
        .join("") || "<p>還沒有新的約定。</p>"
    }</div><p>交往紀念日取自這個存檔正式開始交往的紀錄；舊存檔若沒有日期，不會替你編造。</p>`;
  }
  function outfits() {
    const memories = c().outfitMemories.filter((m) =>
      game().knownPeople.includes(m.npcId),
    );
    return `<p>${esc(outfitDescription(game().outfitId))}</p>${button("打開衣櫃試穿", 'data-pixel-app="wardrobe"')}<p>朋友會在真的見面、作客或赴約時留意。每人每天只留下第一次反應；反覆換裝不會增加好感。</p><div class="city-life-cards">${
      memories
        .slice(-12)
        .reverse()
        .map(
          (m) =>
            `<article><b>${esc(OUTFITS[m.outfitId].name)} · ${esc(NPCS[m.npcId].name)}</b><p>${date(m.day)}</p><p>${esc(m.text)}</p></article>`,
        )
        .join("") || "<p>穿著自己喜歡的衣服，下一次碰面也許會被記住。</p>"
    }</div>`;
  }
  function regulars() {
    return `<p>完成當地的一日行程，才會累積熟悉感；走進場景、逛介面不算一次行程。消息不是錄取保證，安排工作仍遵守原本條件。</p><div class="city-life-cards">${Object.entries(
      REGULAR_PLACES,
    )
      .map(([id, p]) => {
        const entry = c().regulars[id],
          count = entry?.days.length || 0,
          offer = regularOpportunity(game(), id);
        return `<article><h3>${esc(MAP_LOCATIONS[id].name)}</h3><p>一起生活過的日子：${count}</p><p>${esc(count >= 3 ? p.greeting : "還在慢慢熟悉這裡。")}</p>${offer ? `<p>${esc(offer.info)}</p>${button(offer.offer, `data-city-regular="${id}"`)}` : entry?.redeemed ? "<p>已照著熟客消息完成過一次安排。</p>" : ""}</article>`;
      })
      .join("")}</div>`;
  }
  function pets() {
    const p = c().pet;
    if (!p)
      return `<p>只迎接一位小夥伴。基本照顧自動維持，不會因為漏登入生病，也不會要求你每天打卡。出遠門時需先託顧。</p><label>小夥伴的名字<input id="city-pet-name" maxlength="16" value="小星"></label><div class="panel-actions">${button("迎接貓咪", 'data-city-adopt="cat"')}${button("迎接狗狗", 'data-city-adopt="dog"')}</div><p>確認前可以再想一想；不收費、不消耗日期。</p>`;
    return `<h3>${esc(p.name)} · ${p.kind === "cat" ? "貓咪" : "狗狗"}</h3><p>${esc(c().notice || "家裡多了一個安穩的小呼吸。")}</p><p>散步 ${p.walks.length} 次。基本照顧穩定，不需每日操作。</p><div class="panel-actions">${button("陪牠坐一下", "data-city-comfort")}${button("安排河邊散步 · 1 天", 'data-city-plan="pet_walk"')}</div><h3>本週出遠門託顧</h3><p>前往機場的一日行程會使用託顧。熟人會先確認當天有空；照顧服務每次 $300，實際出發才扣款，取消未出發行程不扣費。</p><label>託顧對象<select id="city-pet-carer"><option value="none">尚不安排</option><option value="service" ${p.care?.npcId === "service" ? "selected" : ""}>照顧服務 · $300／出發日</option>${petCarers(
      game(),
    )
      .map(
        (id) =>
          `<option value="${id}" ${p.care?.npcId === id ? "selected" : ""}>${esc(NPCS[id].name)} · 幫忙照顧</option>`,
      )
      .join(
        "",
      )}</select></label>${button("確認本週託顧", "data-city-care")}<p>目前：${p.care?.week === game().week ? (p.care.npcId === "service" ? "已選照顧服務" : esc(NPCS[p.care.npcId].name)) : "本週尚未安排"}</p>`;
  }
  function practice() {
    return `<h3>對戲接話</h3><p>三個小場景，練習聽見對手。沒有倒數計時；鍵盤或觸控都能選答案。</p><p>一次占一天、疲勞與體力各 5。略過挑戰仍有基礎演技 +4；每接住一個轉折再 +1。</p><p>已完整練習 ${c().practice.mastered} 次。${c().practice.mastered >= 3 ? "已能快速複習，效果等同完成三個轉折。" : "完整練習三次後開放快速複習。"}</p>${button("安排練習日", 'data-city-plan="city_challenge"')}`;
  }
  function echoes() {
    return `<p>私人相處只會被當事人提起。公開照片要先在赴約時詢問，對方同意後再由你分享；清楚入鏡的合照可能讓人猜測，但不會自動公開關係。</p><div class="city-life-cards">${
      c()
        .echoes.filter(
          (e) =>
            e.status === "delivered" && game().knownPeople.includes(e.npcId),
        )
        .slice(-20)
        .reverse()
        .map(
          (e) =>
            `<article><b>${esc(NPCS[e.npcId].name)} · 那天之後</b><p>${esc(e.text)}</p>${cityEvent(life(), e.id) ? button("回覆：找一天一起練習", `data-city-invite="${esc(e.id)}"`) : ""}</article>`,
        )
        .join("") || "<p>那些小事會在後來的訊息裡，再被提起。</p>"
    }</div><h3>合照與分享</h3><div class="city-life-cards">${
      c()
        .photos.map(
          (p) =>
            `<article><p>${esc(p.text)}</p><small>${date(p.day)}</small>${p.published ? button("收回公開貼文", `data-city-withdraw="${esc(p.id)}"`) : button("分享到星語", `data-city-share="${esc(p.id)}"`)}</article>`,
        )
        .join("") || "<p>還沒有取得分享同意的合照。</p>"
    }</div>`;
  }
  function open(next = tab) {
    const views = { calendar, outfits, regulars, pets, practice, echoes };
    tab = Object.hasOwn(views, next) ? next : "calendar";
    show(
      "city-life",
      `${heading("CITY & HEART", "城市生活", "熟悉一座城，也慢慢學會與人一起生活。")}<nav class="home-life-tabs" aria-label="城市生活分類">${[
        ["calendar", "日曆"],
        ["outfits", "穿搭"],
        ["regulars", "熟客"],
        ["pets", "陪伴"],
        ["practice", "練習"],
        ["echoes", "回響"],
      ]
        .map(
          ([id, label]) =>
            `<button data-city-tab="${id}" aria-pressed="${id === tab}">${label}</button>`,
        )
        .join("")}</nav>${views[tab]()}${back}`,
    );
  }
  function invite(eventId, rescheduleId = null, selectedNpc = null) {
    const old = c().appointments.find((a) => a.id === rescheduleId);
    const event =
      cityEvent(life(), eventId) ||
      (old && {
        id: old.eventId,
        due: old.due,
        kind: old.kind,
        title: old.title,
        npcId: old.npcId,
      });
    if (!event) return toast("這個邀請已過期或有了變化。");
    const ids = event.npcId
      ? [event.npcId]
      : game().knownPeople.filter((id) => Object.hasOwn(NPCS, id));
    const npcId = selectedNpc || old?.npcId || ids[0];
    booking = { eventId, rescheduleId, npcId };
    const now = cityDay(game(), life().day),
      days = Array.from({ length: 15 }, (_, i) => event.due - 7 + i).filter(
        (d) => d >= now && d <= 1819,
      );
    show(
      "city-invite",
      `${heading("SAVE A DAY", event.title, "選日期即送出邀請；只替換這一天的例行活動，不會蓋掉正式約定。")}${ids.length > 1 ? `<div class="panel-actions">${ids.map((id) => button(NPCS[id].name, `data-city-person="${id}"`)).join("")}</div>` : ""}<h3>${esc(NPCS[npcId]?.name || "目前沒有可以邀請的朋友")}</h3><div class="city-life-cards">${
        npcId
          ? days
              .map((day) => {
                const reason = cityBookingProblem(
                  life(),
                  eventId,
                  npcId,
                  day,
                  rescheduleId,
                );
                const planned =
                  Math.floor(day / 7) === game().week - 1
                    ? api.definitions[life().plan[day % 7].id]?.label
                    : "尚無例行安排";
                return `<article><b>${date(day)}</b><p>${esc(reason || `原安排：${planned}。${event.kind === "collab" ? "對戲不收費" : "聚會 $300"} · 1 天`)}</p>${button("確認約這一天", `data-city-book="${day}"`, !!reason)}</article>`;
              })
              .join("")
          : ""
      }</div>${button("返回城市生活", 'data-city-tab="calendar"')}`,
    );
  }
  function chooseDay(assignment) {
    show(
      "city-plan",
      `${heading("ONE DAY", api.definitions[assignment.id].label, "占一天，開始前會再顯示資源成本。選一天替換例行安排。")}<div class="home-day-grid">${life()
        .plan.map((a, day) => {
          const reason =
            day < life().day || (day === life().day && life().pending)
              ? "已經開始"
              : a.id.startsWith("career_") ||
                  a.id === "home_host" ||
                  a.appointmentId
                ? "已有正式約定"
                : api.access(life(), assignment, day, true);
          return button(
            `週${"一二三四五六日"[day]} · ${reason || api.definitions[a.id].label}`,
            `data-city-plan-day="${day}" data-city-assignment="${esc(JSON.stringify(assignment))}"`,
            !!reason,
          );
        })
        .join("")}</div>${back}`,
    );
  }
  function saveResult(result, next = tab) {
    checkpoint();
    changed();
    open(next);
    toast(result.message);
  }
  function miniGame() {
    const p = life().pending;
    if (p?.assignment.id !== "city_challenge") return false;
    p.assignment.answers ||= [];
    if (p.assignment.answers.length >= 3) {
      p.decisionMade = true;
      api.startPose("played");
      return true;
    }
    const round = ACTING_ROUNDS[p.assignment.answers.length];
    p.phase = "decision";
    life().auto = false;
    show(
      "city-minigame",
      `${heading("LISTEN & RESPOND", `對戲接話 · ${p.assignment.answers.length + 1} / 3`, "沒有倒數，可以慢慢想，也可以略過。")}<p>${esc(p.feedback || "")}</p><h3>${round.prompt}</h3><div class="command-list">${round.choices.map((label, i) => button(label, `data-city-answer="${i}" data-city-round="${p.assignment.answers.length}"`)).join("")}</div><div class="panel-actions">${button("略過挑戰，做基礎練習", "data-city-practice-skip")}${c().practice.mastered >= 3 ? button("快速複習", "data-city-practice-quick") : ""}</div>`,
    );
    checkpoint();
    return true;
  }
  function handle(target) {
    const d = target.dataset;
    if (d.cityTab) {
      open(d.cityTab);
      return true;
    }
    if (d.cityInvite) {
      invite(d.cityInvite);
      return true;
    }
    if (d.cityReschedule) {
      const a = c().appointments.find((a) => a.id === d.cityReschedule);
      if (a) invite(a.eventId, a.id);
      return true;
    }
    if (d.cityPerson && booking) {
      invite(booking.eventId, booking.rescheduleId, d.cityPerson);
      return true;
    }
    if (d.cityBook && booking) {
      saveResult(
        bookCityAppointment(
          life(),
          api.definitions,
          booking.eventId,
          booking.npcId,
          Number(d.cityBook),
          booking.rescheduleId,
        ),
        "calendar",
      );
      return true;
    }
    if (d.cityCancel) {
      saveResult(cancelCityAppointment(life(), d.cityCancel), "calendar");
      return true;
    }
    if (d.cityRegular) {
      const offer = regularOpportunity(game(), d.cityRegular);
      if (offer) chooseDay({ id: offer.action, regularId: d.cityRegular });
      return true;
    }
    if (d.cityPlan) {
      chooseDay({ id: d.cityPlan });
      return true;
    }
    if (d.cityPlanDay !== undefined) {
      let a;
      try {
        a = JSON.parse(d.cityAssignment);
      } catch {
        return true;
      }
      const error = api.planDay(life(), Number(d.cityPlanDay), a);
      saveResult({ message: error || "已排入一日行程，可在本週行程查看。" });
      return true;
    }
    if (d.cityAdopt) {
      const name = document.getElementById("city-pet-name").value;
      show(
        "city-adopt",
        `${heading("A NEW ROOMMATE", `迎接${esc(name)}？`, "一次只養一位小夥伴，基本照顧自動維持；不收費、不耗日期。")}<div class="panel-actions">${button("再想想", 'data-city-tab="pets"')}${button("確認一起生活", `data-city-adopt-confirm="${d.cityAdopt}" data-city-pet-name="${esc(name)}"`)}</div>`,
      );
      return true;
    }
    if (d.cityAdoptConfirm) {
      saveResult(
        withCore(life(), () =>
          adoptPet(
            d.cityAdoptConfirm,
            d.cityPetName,
            cityDay(game(), life().day),
          ),
        ),
        "pets",
      );
      api.refresh?.();
      return true;
    }
    if (d.cityComfort !== undefined) {
      saveResult(withCore(life(), comfortPet), "pets");
      return true;
    }
    if (d.cityCare !== undefined) {
      const id = document.getElementById("city-pet-carer").value;
      saveResult(
        withCore(life(), () => setPetCare(id)),
        "pets",
      );
      return true;
    }
    if (d.cityShare) {
      show(
        "city-share",
        `${heading("SHARE A MEMORY", "公開這張合照？", "對方已同意分享。兩人的臉清楚入鏡，公開後可能被認出與討論；不等於公開交往關係。")}${button("保留私人回憶", 'data-city-tab="echoes"')}${button("確認分享到星語", `data-city-share-confirm="${esc(d.cityShare)}"`)}`,
      );
      return true;
    }
    if (d.cityShareConfirm) {
      saveResult(
        withCore(life(), () => publishCityPhoto(d.cityShareConfirm)),
        "echoes",
      );
      return true;
    }
    if (d.cityWithdraw) {
      saveResult(
        withCore(life(), () => withdrawCityPhoto(d.cityWithdraw)),
        "echoes",
      );
      return true;
    }
    if (d.cityAnswer !== undefined) {
      const p = life().pending,
        answer = Number(d.cityAnswer);
      if (
        p?.assignment.id === "city_challenge" &&
        p.phase === "decision" &&
        Number(d.cityRound) === p.assignment.answers.length &&
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer <= 2 &&
        p.assignment.answers.length < 3
      ) {
        p.feedback = ACTING_ROUNDS[p.assignment.answers.length].feedback;
        p.assignment.answers.push(answer);
        miniGame();
      }
      return true;
    }
    if (d.cityPracticeSkip !== undefined || d.cityPracticeQuick !== undefined) {
      const p = life().pending;
      if (p?.assignment.id === "city_challenge" && p.phase === "decision") {
        p.assignment.answers = [];
        p.decisionMade = true;
        api.startPose(
          d.cityPracticeQuick !== undefined && c().practice.mastered >= 3
            ? "quick"
            : "skip",
        );
      }
      return true;
    }
    return false;
  }
  return { open, handle, miniGame };
}
