import { eventContext } from "../logic/event-context.js";
import { createStoryDirector } from "./story-director.js";
import { withCore, CHOICES, DAY_NAMES, definition } from "./life.js";
import {
  bookCareer,
  bookingDays,
  careerCommand,
  currentStory,
  chooseStory,
  NPC_INTERACTIONS,
  productionRoom,
} from "./career.js";
import { AGENCIES } from "../data/agencies.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { NPCS } from "../data/npcs.js";
import { INDUSTRY_COMPANIES } from "../data/industry.js";
import { jobsVisibleAt, canAccessJob } from "../logic/industry.js";
import {
  availableJobs,
  qualification,
  jobState,
  marketAdjustedPay,
} from "../logic/job-engine.js";
import {
  agencyRequirementRows,
  canApplyToAgency,
  agencyRenewalPreview,
} from "../logic/agency.js";
import { currentOfferTerms } from "../logic/contract-negotiation.js";
import { negotiateAgencyTerms } from "../logic/contract-negotiation.js";
import {
  CREATIVE_DIRECTIONS,
  setCreativeDirection,
} from "../logic/creative.js";
import {
  eligibleCreativeCollaborators,
  toggleCreativeCollaborator,
  setCreativeBudget,
  CREATIVE_BUDGETS,
} from "../logic/creative-team.js";
import { eventStoryArt } from "../data/story-art.js";
import { romanceStageLabel } from "../logic/romance-engine.js";
import { ROOMS } from "./data.js";
import { roomIllustration } from "./city-rooms.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const plain = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, "");
const money = (n) => `$${Number(n || 0).toLocaleString()}`;
const btn = (label, attrs = "", disabled = false) =>
  `<button ${attrs} ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
const back = `<div class="panel-actions">${btn("◀ 職涯與故事", 'data-career="hub"')}${btn("回到場景", 'data-ui="close"')}</div>`;
const stageNames = {
  available: "公開徵選",
  applied: "已登記",
  audition_scheduled: "試鏡已排定",
  failed: "未獲選",
  passed: "等待簽約",
  active: "製作中",
  completed: "已完成",
  breached: "逾期",
};
export function createCareerUI(api) {
  const life = () => api.state().life,
    read = (fn) => withCore(life(), fn);
  let boardVenue = null,
    boardPage = 0,
    booking = null;
  const show = (type, title, body, note = "") =>
    api.show(
      type,
      `${api.heading("STARLIGHT CAREER", title, note)}${body}${back}`,
    );
  const save = () => {
    api.state().knownPeople = [
      ...new Set([...api.state().knownPeople, ...life().game.knownPeople]),
    ];
    api.checkpoint();
    api.changed();
  };
  const director = createStoryDirector({
    ...api,
    save,
    escape: esc,
    choices: () => currentStory(life())?.choices || [],
    choose: (id) => chooseStory(life(), id),
    fallback: (story) => narrative(story, true),
  });
  function hub() {
    const game = life().game;
    show(
      "career",
      "職涯與故事",
      `<div class="career-dashboard"><div><small>正式作品</small><strong>${game.completedWorks.length}</strong></div><div><small>簽約準備度</small><strong>${game.contract}%</strong></div><div><small>經紀公司</small><strong>${AGENCIES[game.currentAgencyId]?.name || "自由新人"}</strong></div></div><div class="career-grid">${[
        ["board", "公開徵選與通告", "tv"],
        ["agencies", "經紀公司", "business"],
        ["portfolio", "作品與獎項", "theatre"],
        ["stories", "故事與來信", "home"],
        ["contacts", "人物與約定", "cafe"],
        ["projects", "原創製作", "recording"],
      ]
        .map(
          ([id, label, room]) =>
            `<button class="career-tile" data-career="${id}">${roomIllustration(ROOMS[room])}<strong>${label}</strong></button>`,
        )
        .join(
          "",
        )}</div>${game.endingResult ? btn("閱讀五年結局", 'data-career="ending"') : ""}`,
      "從現場的機會開始，讓作品、關係和生活慢慢累積。",
    );
  }
  function board(venue = null, page = 0) {
    boardVenue = venue;
    boardPage = page;
    const jobs = read(() =>
      venue
        ? jobsVisibleAt(venue)
        : availableJobs().filter(
            (j) => canAccessJob(j).ok || life().game.activeJobs[j.id],
          ),
    );
    const game = life().game;
    const active = Object.values(game.activeJobs).filter((r) =>
      ["active", "passed", "applied", "audition_scheduled", "failed"].includes(
        r.stage,
      ),
    );
    const ordered = [
      ...new Set([...active.map((r) => r.jobId), ...jobs.map((j) => j.id)]),
    ]
      .map((id) => JOB_BY_ID[id])
      .filter(Boolean);
    const pages = Math.max(1, Math.ceil(ordered.length / 8));
    boardPage = Math.min(page, pages - 1);
    show(
      "career-board",
      venue
        ? Object.values(INDUSTRY_COMPANIES).find((c) => c.locationId === venue)
            ?.name || "現場徵選"
        : "工作信箱",
      `<div class="career-board">${
        ordered
          .slice(boardPage * 8, boardPage * 8 + 8)
          .map(
            (j) =>
              `<button class="career-job-card" data-job="${j.id}"><span>${esc(j.category)} · ${"★".repeat(j.stars)}</span><strong>${esc(j.title)}</strong><small>${stageNames[game.activeJobs[j.id]?.stage || "available"]} · ${j.sessions} 次工作</small></button>`,
          )
          .join("") ||
        '<p class="empty-note">信箱還沒有正式工作。到電視台、影業、唱片公司或製作公司看看公開徵選。</p>'
      }</div><div class="panel-actions">${btn("上一頁", `data-board-page="${boardPage - 1}"`, !boardPage)}<span>${boardPage + 1} / ${pages}</span>${btn("下一頁", `data-board-page="${boardPage + 1}"`, boardPage + 1 >= pages)}${btn("去城市找機會", 'data-ui="travel"')}</div>${
        game.sequelOffers
          ?.filter((o) => o.status === "active")
          .map(
            (o) =>
              `<article class="career-card"><b>${esc(o.title)}</b><p>${o.completedSessions}/${o.requiredSessions} 次</p>${btn("安排續作製作", `data-book="sequel" data-id="${esc(o.id)}"`)}</article>`,
          )
          .join("") || ""
      }`,
      "公開資訊可隨時閱讀。資格、試鏡結果與正式合約分別成立。",
    );
  }
  function job(id) {
    const j = JOB_BY_ID[id];
    if (!j) return;
    const info = read(() => ({
      r: structuredClone(jobState(id)),
      q: qualification(j),
      access: canAccessJob(j),
      pay: marketAdjustedPay(j),
    }));
    const { r, q } = info;
    const commands =
      r.stage === "available"
        ? btn(
            "登記試鏡",
            `data-career-command="apply-job" data-id="${id}"`,
            !q.met || !info.access.ok,
          )
        : ["applied", "failed"].includes(r.stage)
          ? btn("選一天試鏡", `data-book="audition" data-id="${id}"`)
          : r.stage === "passed"
            ? btn(
                "確認簽署通告",
                `data-career-command="sign-job" data-id="${id}"`,
              )
            : r.stage === "active"
              ? btn("安排正式工作", `data-book="job" data-id="${id}"`)
              : "";
    show(
      "career-job",
      j.title,
      `<div class="career-feature">${roomIllustration(ROOMS[productionRoom(j.category)])}<div><span>${esc(j.category)} · ${"★".repeat(j.stars)}</span><h3>${stageNames[r.stage]}</h3><p>殺青總酬勞 ${money(info.pay)}（經紀抽成另計）</p><p>${r.stage === "active" ? `剩餘 ${r.remainingSessions} 次 · 第 ${r.deadlineWeek} 週前完成` : `${j.sessions} 次工作 · 簽約後 ${j.deadlineWeeks} 週內完成`}</p></div></div><p>${esc(plain(j.synopsis || j.audition?.prompt))}</p><details><summary>角色要求與履歷條件</summary>${q.rows.map((v) => `<p>${v.met ? "✓" : "○"} ${esc(v.name)} ${Math.round(v.current)} / ${v.required}</p>`).join("")}<p>訓練 ${q.training}/${q.trainingRequired} 次</p><p>${esc(q.commitmentReason || q.doctrineReason || "")}</p></details><p class="result-note">${esc(r.notice || (!info.access.ok ? info.access.reason : !q.met ? "先補足角色要求，再來試試。" : "可以登記這次徵選。"))}</p><div class="panel-actions">${commands}${btn("查看行程", 'data-ui="schedule"')}</div>`,
    );
  }
  function agency(id) {
    const a = AGENCIES[id];
    if (!a) return;
    const data = read(() => ({
        rows: agencyRequirementRows(a),
        can: canApplyToAgency(a),
        terms: currentOfferTerms(a),
        renewal: agencyRenewalPreview(),
      })),
      g = life().game,
      app = g.agencyApplications[id];
    const offer = g.agencyOffer?.agencyId === id;
    let actions = btn(
      "投遞新人履歷",
      `data-career-command="apply-agency" data-id="${id}"`,
      !data.can,
    );
    if (app?.status === "applied")
      actions = btn(
        "選一天面談",
        `data-book="interview" data-id="${id}"`,
        g.week <= app.appliedWeek,
      );
    if (app?.status === "interview_scheduled")
      actions = btn("查看面談日期", 'data-ui="schedule"');
    if (g.currentAgencyId === id)
      actions = btn(
        "談續約",
        `data-career-command="renew-agency" data-id="${id}"`,
        !data.renewal?.eligible,
      );
    if (offer)
      actions = `${btn("確認簽署合約", `data-career-command="accept-agency" data-id="${id}"`)}${btn("婉拒合約", `data-career-command="decline-agency" data-id="${id}"`)}${btn("爭取降低抽成", `data-negotiate="${id}"`)}`;
    show(
      "career-agency",
      a.name,
      `<div class="career-feature">${roomIllustration(ROOMS[`agency_${id}`])}<div><p>${esc(a.description || a.style || a.tagline || "")}</p><b>${offer ? "正式錄取通知" : app?.status === "applied" ? `履歷已送達 · 第 ${app.appliedWeek + 1} 週可約面談` : g.currentAgencyId === id ? `合約至第 ${g.agencyContractEndWeek} 週` : "公開接待與履歷審核"}</b></div></div><div class="career-requirements">${data.rows.map((r) => `<div><span>${esc(r.label)}</span><b>${Math.round(r.current)} / ${r.required}${r.unit}</b><progress max="${r.required}" value="${r.current}"></progress></div>`).join("")}</div><p>合約 ${data.terms.durationWeeks} 週 · 抽成 ${Math.round(data.terms.commissionRate * 100)}% · 創作自由 ${data.terms.creativeFreedom}</p><div class="panel-actions">${actions}${btn("練習試鏡，累積準備", 'data-offer="audition_practice"')}</div>`,
      "投遞 → 下一週回覆 → 現場面談 → 閱讀合約 → 簽約",
    );
  }
  function book(kind, id, extra) {
    const payload = ["social_post", "manager_interact"].includes(kind)
      ? { type: id }
      : kind === "npc"
        ? { npcId: id, type: extra }
        : kind === "interview"
          ? { agencyId: id }
          : kind === "sequel"
            ? { offerId: id }
            : kind.startsWith("creative_")
              ? { projectId: id, ...(extra ? { companyId: extra } : {}) }
              : { jobId: id };
    booking = { kind, payload };
    const days = bookingDays(life(), CHOICES, kind, payload);
    show(
      "career-booking",
      "留一天給這件事",
      `<div class="career-date-list">${days.map((open, i) => `<button data-book-day="${i}" ${open ? "" : "disabled"}><strong>${DAY_NAMES[i]}</strong><small>${esc(definition(life(), life().plan[i]).label)}</small><span>${i < life().day ? "已結束" : open ? "改排這一天" : "已有約定／不合檔期"}</span></button>`).join("")}</div>`,
      "選擇後會替換這一天原本的普通安排；既有正式約定需先在行程表取消。",
    );
  }
  function contact(id) {
    const npc = NPCS[id],
      g = life().game;
    if (!npc || !g.knownPeople.includes(id)) return;
    const rel = g.relationships[id] || {};
    show(
      "career-contact",
      npc.name,
      `<div class="contact-portrait"><img src="${npc.portrait}" alt="${npc.name}"><div><p>${esc(npc.job)}</p><p>親近 ${rel.closeness || 0} · 信任 ${rel.trust || 0}</p><p>${esc(romanceStageLabel(rel.romance || "none"))}</p></div></div><div class="command-list">${Object.entries(
        NPC_INTERACTIONS,
      )
        .map(([type, v]) =>
          btn(
            `${v.label}${v.cost ? ` · ${money(v.cost)}` : ""}`,
            `data-book="npc" data-id="${id}" data-extra="${type}"`,
          ),
        )
        .join("")}</div><details><summary>最近的共同回憶</summary>${
        (g.npcInteractionMemories || [])
          .filter((m) => m.npcId === id)
          .slice(-5)
          .reverse()
          .map((m) => `<p>第 ${m.week} 週 · ${esc(m.outcome)}</p>`)
          .join("") || "下一次相處，會成為新的回憶。"
      }</details>`,
      "先約好日期，當天在場景相處。對方的工作、信任和關係界線會影響是否答應。",
    );
  }
  function project(id) {
    const p = life().game.creativeProjects.find((p) => p.id === id);
    if (!p) return;
    const collaborators = read(() => eligibleCreativeCollaborators(p));
    let actions = "";
    if (["draft", "rejected"].includes(p.status))
      actions += btn(
        "安排寫作／修稿",
        `data-book="creative_work" data-id="${esc(id)}"`,
      );
    if (p.status === "ready") {
      actions += btn(
        "保留權利，自主製作",
        `data-career-command="independent" data-id="${esc(id)}"`,
      );
      for (const c of Object.values(INDUSTRY_COMPANIES).filter((c) =>
        p.type === "song"
          ? c.type === "唱片公司"
          : p.type === "show"
            ? c.type === "電視公司"
            : ["電影公司", "電視公司"].includes(c.type),
      ))
        actions +=
          btn(
            `投稿${c.name}`,
            `data-book="creative_submit" data-id="${esc(id)}" data-extra="${c.id}"`,
          ) +
          btn(
            `洽售企劃給${c.name}`,
            `data-book="creative_sale" data-id="${esc(id)}" data-extra="${c.id}"`,
          );
    }
    if (["contracted", "production"].includes(p.status))
      actions += btn(
        "安排一天製作",
        `data-book="creative_production" data-id="${esc(id)}"`,
      );
    if (p.status === "ready_release")
      actions += btn(
        "安排正式發行",
        `data-book="creative_release" data-id="${esc(id)}"`,
      );
    show(
      "career-project",
      p.title,
      `<div class="buttons"><button data-pixel-app="creative">完整作品資料與製作分工</button></div><div class="career-feature">${roomIllustration(ROOMS[p.type === "song" ? "recording" : p.type === "show" ? "tv" : "studio"])}<div><b>${{ draft: "創作中", rejected: "修改後可再投", ready: "草稿完成", contracted: "準備製作", production: "製作中", ready_release: "準備發行", released: "正式發行", sold: "已售企劃權" }[p.status] || p.status}</b><p>草稿 ${p.progress}% · 製作 ${p.productionProgress}%</p><p>品質 ${p.quality} · 團隊 ${p.team.length} 人</p></div></div><div class="command-list">${actions}</div>${
        ["draft", "rejected", "ready"].includes(p.status)
          ? `<details><summary>作品方向</summary>${Object.entries(
              CREATIVE_DIRECTIONS[p.type],
            )
              .map(([key, d]) =>
                btn(
                  `${p.direction === key ? "✓ " : ""}${d.label}`,
                  `data-project-direction="${key}" data-id="${esc(id)}"`,
                ),
              )
              .join("")}</details>`
          : ""
      }${
        ["contracted", "production", "ready_release"].includes(p.status)
          ? `<details open><summary>製作預算與合作團隊</summary><div class="panel-actions">${Object.entries(
              CREATIVE_BUDGETS,
            )
              .map(([key, d]) =>
                btn(
                  `${p.budgetTier === key ? "✓ " : ""}${d.label} ${money(d.cost)}`,
                  `data-project-budget="${key}" data-id="${esc(id)}"`,
                  p.productionSessions > 0,
                ),
              )
              .join(
                "",
              )}</div><p>預算只在首次製作收取。排定團隊製作後，需先取消行程才能更換人員。</p>${collaborators.map((n) => btn(`${p.team.includes(n.id) ? "✓ " : ""}${n.name}`, `data-project-person="${n.id}" data-id="${esc(id)}"`)).join("") || "與同領域的人物熟悉後，可以邀請合作。"}</details>`
          : ""
      }`,
    );
  }
  function stories() {
    const story = currentStory(life());
    save();
    if (story) return narrative(story);
    const g = life().game;
    show(
      "career-stories",
      "故事與來信",
      `<p class="empty-note">目前沒有待決定的劇情。新的消息會隨日期、作品與關係出現。</p><div class="career-card-list">${(
        g.npcMessages || []
      )
        .slice(-12)
        .reverse()
        .map(
          (m) =>
            `<article class="career-card"><strong>${esc(NPCS[m.npcId]?.name || m.title || "星望市來信")}</strong><p>${esc(plain(m.text))}</p></article>`,
        )
        .join("")}</div><details><summary>每週生活手帳</summary>${g.history
        .slice()
        .reverse()
        .map(
          (w) =>
            `<details><summary>第 ${w.week} 週</summary>${w.results.map((r) => `<p><b>${esc(r.day)} · ${esc(r.action)}</b><br>${esc(r.result || r.text)}</p>`).join("")}</details>`,
        )
        .join(
          "",
        )}</details><details><summary>過去的選擇</summary>${g.eventHistory
        .slice(-20)
        .reverse()
        .map(
          (e) =>
            `<p>第 ${e.week} 週 · ${esc(e.title)}<br>${esc(e.choiceLabel || e.outcome)}</p>`,
        )
        .join("")}</details>`,
    );
  }
  function narrative(story, fallback = false) {
    if (!fallback && director.present(story)) return;
    const e = story.event || story.outcome,
      art = eventStoryArt(e);
    const context = story.context || eventContext(e),
      npcId = context.npcIds[0],
      names = context.npcIds.map((id) => NPCS[id].name).join("、");
    api.narrate({
      title: plain(e.title),
      context: `${story.outcome ? (names ? "關係回顧" : "故事回顧") : context.channel === "message" ? "人物來信" : names ? "人物故事" : "旅程記事"}${context.week ? ` · 第 ${context.week} 週收錄` : ""}`,
      contextNote: names ? `手帳裡的${names}` : "",
      text: plain(story.outcome ? e.outcome || "這次選擇已寫進旅程。" : e.text),
      portrait: NPCS[npcId]?.portrait,
      art: !NPCS[npcId] && art?.src,
      choices: story.outcome
        ? [{ label: "把這一刻記下來", attrs: 'data-story-done="true"' }]
        : story.choices.length
          ? story.choices.map((c) => ({
              label: c.label,
              attrs: `data-story-choice="${esc(c.id)}"`,
              note: c.note,
            }))
          : [{ label: "繼續", attrs: 'data-story-choice="confirm"' }],
    });
  }
  function portfolio() {
    const g = life().game;
    show(
      "career-portfolio",
      "作品履歷與獎櫃",
      `<div class="buttons"><button data-pixel-app="log">完整作品與生涯紀錄</button><button data-pixel-app="achievements">永久成就</button><button data-pixel-app="timeline">人生時間線</button></div><div class="career-dashboard"><div><small>正式作品</small><strong>${g.completedWorks.length}</strong></div><div><small>獎項／入圍</small><strong>${g.awards.length}</strong></div><div><small>知名度</small><strong>${g.fame}</strong></div></div><div class="career-card-list">${
        g.completedWorks
          .slice()
          .reverse()
          .map(
            (w) =>
              `<article class="career-card"><span>${esc(w.category)} · ${esc(w.role)}</span><h3>${esc(w.title)}</h3><p>第 ${w.completedWeek} 週 · 品質 ${w.quality} · ${w.original ? "原創" : "正式演出"}</p><small>${(
                w.npcCast || []
              )
                .map((id) => NPCS[id]?.name)
                .filter(Boolean)
                .join("、")}</small></article>`,
          )
          .join("") || "<p>完成第一部通告或發行原創後，作品會留在這裡。</p>"
      }</div><details><summary>獎項紀錄</summary>${g.awards.map((a) => `<p>${esc(a.name || a.awardName || a.awardId || "獎季")} · ${esc(a.result)}</p>`).join("") || "符合資格的作品會自動進入原本的獎季評選。"}</details>${g.endingResult ? btn("閱讀結局", 'data-career="ending"') : ""}`,
    );
  }
  function ending() {
    const e = life().game.endingResult;
    if (!e) return hub();
    show(
      "career-ending",
      e.title,
      `<div class="career-feature">${roomIllustration(ROOMS.home)}<div><span>${esc(e.rank)}</span><h3>${esc(e.route)}</h3><p>${e.portfolio.works} 部作品 · ${e.awardWins} 座獎 · ${e.score} 分</p></div></div><p>${esc(e.summary)}</p><div class="panel-actions">${btn("保存這段人生", 'data-ui="saves"')}${btn("查看作品", 'data-pixel-app="log"')}${btn("開啟下一段人生", 'data-storage="new"')}</div>`,
      "這段旅程的作品、選擇與關係已保存。",
    );
  }
  function handle(target) {
    if (director.handle(target)) return true;
    const d = target.dataset;
    if (d.career) {
      (
        ({
          hub,
          board,
          portfolio,
          stories,
          ending,
          agencies: api.agencies,
          contacts: () => api.phone("contacts"),
          projects: api.creative,
        })[d.career] || hub
      )();
      return true;
    }
    if (d.job) {
      job(d.job);
      return true;
    }
    if (d.agencyInfo) {
      agency(d.agencyInfo);
      return true;
    }
    if (d.contact) {
      contact(d.contact);
      return true;
    }
    if (d.projectDetail) {
      project(d.projectDetail);
      return true;
    }
    if (d.boardVenue) {
      board(d.boardVenue);
      return true;
    }
    if (d.boardPage !== undefined) {
      board(boardVenue, Number(d.boardPage));
      return true;
    }
    if (d.book) {
      book(d.book, d.id, d.extra);
      return true;
    }
    if (d.bookDay !== undefined && booking) {
      const r = bookCareer(
        life(),
        CHOICES,
        booking.kind,
        booking.payload,
        Number(d.bookDay),
      );
      save();
      api.toast(r.message || "已排入行程");
      if (r.ok) {
        booking = null;
        api.schedule(Number(d.bookDay));
      }
      return true;
    }
    if (d.careerCommand) {
      const r = careerCommand(life(), d.careerCommand, d.id);
      save();
      api.toast(r.message || "已完成");
      if (d.careerCommand.includes("agency")) agency(d.id);
      else if (d.careerCommand === "independent") project(d.id);
      else job(d.id);
      return true;
    }
    if (d.negotiate) {
      const r = read(() => negotiateAgencyTerms(AGENCIES[d.negotiate]));
      save();
      agency(d.negotiate);
      api.toast(r.message);
      return true;
    }
    if (d.projectDirection || d.projectBudget || d.projectPerson) {
      const queued = Object.values(life().game.scheduledActivities).some(
        (t) =>
          t.payload?.projectId === d.id &&
          t.status === "scheduled" &&
          t.kind === "creative_production",
      );
      const r = queued
        ? { message: "先取消已排定的團隊製作，才能調整團隊與預算" }
        : read(() =>
            d.projectDirection
              ? setCreativeDirection(d.id, d.projectDirection)
              : d.projectBudget
                ? setCreativeBudget(d.id, d.projectBudget)
                : toggleCreativeCollaborator(d.id, d.projectPerson),
          );
      save();
      project(d.id);
      api.toast(r.message);
      return true;
    }
    if (d.storyChoice) {
      const r = chooseStory(
        life(),
        d.storyChoice === "confirm" ? null : d.storyChoice,
      );
      save();
      if (r) narrative({ outcome: r });
      return true;
    }
    if (d.storyDone) {
      life().game.eventOutcome = null;
      save();
      api.leaveOverlay();
      api.afterStory?.();
      return true;
    }
    return false;
  }
  return {
    book,
    hub,
    agency,
    board,
    job,
    project,
    stories,
    ending,
    handle,
    hasStory: () =>
      Boolean(
        life().game.activeEvent ||
        life().game.eventOutcome ||
        life().game.eventQueue.length,
      ),
  };
}
