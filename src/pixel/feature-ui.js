import { openConversation } from "../logic/conversations.js";
import { toggleCommunityLike } from "../logic/community-likes.js";
import { shortContact } from "../logic/short-contact.js";
import { requestRomanceConversation } from "../logic/npc-storylines.js";
import { creativeApp } from "../views/creative.js";
import {
  createCreativeProject,
  setCreativeDirection,
  chooseIndependentProduction,
} from "../logic/creative.js";
import {
  toggleCreativeCollaborator,
  toggleSelfParticipation,
  cycleCreativeRole,
  setCreativeBudget,
} from "../logic/creative-team.js";
import { withCore } from "./core-bridge.js";
import { recordRecentApp } from "../core/app-navigation.js";
import { peopleHubApp } from "../views/people.js";
import { statsApp } from "../views/stats-app.js";
import { worldApp } from "../views/world.js";
import { logApp } from "../views/log.js";
import { timelineApp } from "../views/timeline.js";
import { galleryApp, markGallerySeen } from "../views/gallery.js";
import { achievementsApp } from "../views/achievements.js";
import { socialApp } from "../views/social.js";
import { forumApp } from "../views/forum.js";
import { jobsApp } from "../views/jobs.js";
import { agencyApp } from "../views/agency.js";
import {
  replyToNpcPost,
  forumReaction,
} from "../logic/community-interactions.js";
import { setRomanceVisibility, breakUp } from "../logic/romance-engine.js";
import { negotiateAgencyTerms } from "../logic/contract-negotiation.js";
import { careerCommand, syncCoreSchedule } from "./career.js";
import { CHOICES } from "./life.js";
import { AGENCIES } from "../data/agencies.js";
import { NPCS } from "../data/npcs.js";
import {
  appIcon,
  APP_CATEGORIES,
  APP_CATEGORY_LABELS,
  DEFAULT_DOCK_IDS,
  normalizeDockIds,
} from "../views/app-icons.js";
import { saveLook, LOOK_SLOTS, bonusComparison } from "../logic/wardrobe.js";
import {
  OUTFITS,
  OUTFIT_CATEGORIES,
  outfitCategory,
  portraitAsset,
} from "../data/wardrobe.js";

export const PIXEL_APPS = [
  ["planner", "行程表", "規劃這一週"],
  ["map", "城市地圖", "走進星望市"],
  ["jobs", "工作與徵選", "機會、合約與檔期"],
  ["creative", "創作", "作品與製作"],
  ["people", "人物", "訊息、關係與檔案"],
  ["social", "星語", "分享生活、回應朋友"],
  ["forum", "星聞論壇", "看看大家在聊什麼"],
  ["world", "娛樂圈", "風向、品牌與競爭者"],
  ["agency", "經紀公司", "合約與經紀人"],
  ["stats", "能力", "成長、健康與評價"],
  ["wardrobe", "衣櫃", "試穿與收藏造型"],
  ["timeline", "人生時間線", "回顧每個轉折"],
  ["gallery", "影像館", "收藏故事插畫"],
  ["log", "生涯紀錄", "作品、獎項與週誌"],
  ["achievements", "成就", "一路走來的里程碑"],
  ["save", "存讀檔", "備份與搬移旅程"],
  ["settings", "設定", "聲音、配色與操作"],
];
const views = {
  creative: creativeApp,
  people: peopleHubApp,
  stats: statsApp,
  world: worldApp,
  log: logApp,
  timeline: timelineApp,
  gallery: galleryApp,
  achievements: achievementsApp,
  social: socialApp,
  forum: forumApp,
  jobs: () => jobsApp({ direct: true }),
  agency: agencyApp,
};

export function createFeatureUI(api) {
  let current = "phone",
    fitting = null,
    wardrobeFilter = "all",
    wardrobeCategory = "all";
  const life = () => api.state().life;
  const read = (fn) => withCore(life(), fn);
  const esc = api.escape;
  const save = () => {
    api.checkpoint();
    api.changed();
  };
  const card = ([id, title, note]) =>
    `<button data-pixel-app="${id}"><i>${appIcon(id)}</i><span><b>${title}</b><small>${note}</small></span></button>`;
  function open(id = "phone") {
    if (id === "npc") id = "people";
    recordRecentApp(life().game, id);
    current = id;
    if (api.native[id]) {
      api.native[id]();
      return;
    }
    if (id === "wardrobe") {
      wardrobe();
      return;
    }
    let html;
    if (id === "phone") {
      const recent = life()
        .game.recentAppIds.filter((x) => x !== "phone")
        .map((x) => PIXEL_APPS.find((a) => a[0] === x))
        .filter(Boolean);
      const g = life().game,
        query = (g.appQuery || "").trim().toLowerCase(),
        category = g.appCategory || "全部",
        matches = PIXEL_APPS.filter(
          ([key, title, note]) =>
            (category === "全部" || APP_CATEGORIES[key] === category) &&
            (!query ||
              `${title} ${note} ${APP_CATEGORIES[key]}`
                .toLowerCase()
                .includes(query)),
        ),
        dock = normalizeDockIds(g.dockAppIds),
        draft = normalizeDockIds(g.dockDraftIds, { fallback: false });
      html = `<header class="pocket-heading"><h2>隨身手帳</h2><p>把生活和夢想，放在手邊。</p></header>
      <section class="pocket-favorites"><header><h3>我的常用</h3><button data-pocket-dock="${g.dockEditing ? "cancel" : "edit"}">${g.dockEditing ? "取消編輯" : "編輯捷徑"}</button></header>
      ${
        g.dockEditing
          ? `<p class="tiny-note">選擇 6 個常用功能 · ${draft.length} / 6</p><div class="pocket-dock-editor">${PIXEL_APPS.map(([key, title]) => `<button data-pocket-dock-item="${key}" aria-pressed="${draft.includes(key)}">${title}</button>`).join("")}</div><div class="buttons"><button data-pocket-dock="reset">恢復預設</button><button data-pocket-dock="save" ${draft.length === 6 ? "" : "disabled"}>儲存捷徑</button></div>`
          : `<nav class="pocket-dock" aria-label="常用捷徑">${dock
              .map((key) => PIXEL_APPS.find((a) => a[0] === key))
              .filter(Boolean)
              .map(
                ([key, title]) =>
                  `<button data-pocket-open="${key}"><i>${appIcon(key)}</i><span>${title}</span></button>`,
              )
              .join("")}</nav>`
      }</section>
      ${recent.length ? `<details class="pocket-recent"><summary>最近使用</summary><nav class="recent-apps" aria-label="最近使用">${recent.map(([key, label]) => `<button data-pocket-open="${key}">${label}</button>`).join("")}</nav></details>` : ""}
      <label class="pocket-search">尋找功能<input data-pocket-query type="search" placeholder="搜尋名稱或用途" value="${esc(g.appQuery || "")}"></label>
      <nav class="app-filters" aria-label="功能分類">${APP_CATEGORY_LABELS.map((c) => `<button data-pocket-category="${c}" aria-pressed="${c === category}">${c}</button>`).join("")}</nav>
      <div class="pixel-app-library">${matches.length ? matches.map(card).join("") : `<p>沒有找到符合的功能。試試其他關鍵字或分類。</p>`}</div>`;
    } else if (views[id]) {
      // Read-only pages share the original rules, and scheduling always uses the
      // pixel calendar. Past dates cannot appear as available in these views.
      syncCoreSchedule(life(), CHOICES, true);
      html = read((game) => {
        game.appOpen = id;
        game.npcInvitation = null;
        if (id === "gallery") markGallerySeen();
        return views[id]();
      });
    } else {
      api.toast("找不到這個功能");
      return;
    }
    api.show(
      "app-" + id,
      `<div class="pixel-app" data-app="${id}"><nav class="app-toolbar"><button data-pixel-app="phone">▦ 手帳</button><span>${PIXEL_APPS.find((a) => a[0] === id)?.[1] || "所有功能"}</span><button data-ui="close">回到場景</button></nav>${html}</div>`,
    );
    save();
  }
  function person(id) {
    if (!NPCS[id] || !life().game.knownPeople.includes(id)) {
      api.toast("先在城市裡認識對方，再交換聯絡方式");
      return;
    }
    const game = life().game;
    game.selectedNpc = id;
    game.peopleSection = "profiles";
    game.npcArtView = "bust";
    game.npcProfileTab = "overview";
    open("people");
  }
  function mutate(fn, trigger) {
    const panel = document.querySelector("#panel"),
      scroll = panel?.scrollTop || 0;
    const active = trigger || document.activeElement?.closest("button");
    const focusKey = active
      ? Object.entries(active.dataset).map(([k, v]) => [k, v])
      : [];
    const r = read(fn);
    save();
    open(current);
    if (panel) panel.scrollTop = scroll;
    if (focusKey.length) {
      const next = [...document.querySelectorAll(".pixel-app button")].find(
        (b) => focusKey.every(([k, v]) => b.dataset[k] === v),
      );
      next?.focus({ preventScroll: true });
      if (r?.liked) {
        next?.classList.add("heart-pop");
      }
    }
    if (r?.message || r?.reason) api.toast(r.message || r.reason);
  }
  function wardrobe() {
    current = "wardrobe";
    const s = api.state(),
      g = s.life.game,
      outfit = OUTFITS[fitting || s.outfitId];
    const list = Object.values(OUTFITS).filter(
      (o) =>
        (wardrobeFilter === "all" ||
          g.ownedOutfits[s.avatarId].includes(o.id)) &&
        (wardrobeCategory === "all" ||
          outfitCategory(o.id) === wardrobeCategory),
    );
    api.show(
      "wardrobe",
      `<div class="pixel-app" data-app="wardrobe"><nav class="app-toolbar"><button data-pixel-app="phone">▦ 手帳</button><span>我的衣櫃</span><button data-ui="profile">人物外型</button></nav><div class="fitting-room"><figure><img src="${portraitAsset(s.avatarId, outfit.id)}" alt="${esc(outfit.name)}試穿預覽"><figcaption>${esc(outfit.name)}${fitting ? " · 試穿中" : " · 目前穿著"}</figcaption></figure><div><h2>今天，穿什麼出門？</h2><p>試穿不會扣款，也不會改變場景裡的穿著。</p><div class="bonus-comparison">${bonusComparison(
        g,
        outfit.id,
      )
        .map((r) => `<span>${r.name}<b>${r.before} → ${r.after}</b></span>`)
        .join(
          "",
        )}</div>${fitting ? `<div class="buttons"><button data-fitting-cancel>結束試穿</button>${g.ownedOutfits[s.avatarId].includes(fitting) ? `<button data-outfit="${fitting}" class="primary">換上這套</button>` : `<button data-shop-route>前往服飾店 · $${outfit.price.toLocaleString()}</button>`}</div>` : ""}<h3>我的造型收藏</h3><div class="look-slots">${Object.entries(
        LOOK_SLOTS,
      )
        .map(
          ([key, name]) =>
            `<div><b>${name}</b><small>${esc(OUTFITS[g.savedLooks?.[s.avatarId]?.[key]]?.name || "尚未收藏")}</small><button data-save-look="${key}">收藏目前穿著</button><button data-outfit="${g.savedLooks?.[s.avatarId]?.[key] || ""}" ${g.savedLooks?.[s.avatarId]?.[key] ? "" : "disabled"}>穿上</button></div>`,
        )
        .join(
          "",
        )}</div></div></div><nav class="app-filters"><button data-fitting-filter="all" aria-pressed="${wardrobeFilter === "all"}">全部服裝</button><button data-fitting-filter="owned" aria-pressed="${wardrobeFilter === "owned"}">已擁有</button><select data-fitting-category aria-label="服裝類型"><option value="all">所有類型</option>${Object.entries(
        OUTFIT_CATEGORIES,
      )
        .filter(([c]) => c !== "all")
        .map(
          ([c, name]) =>
            `<option value="${c}" ${c === wardrobeCategory ? "selected" : ""}>${esc(name)}</option>`,
        )
        .join(
          "",
        )}</select></nav><div class="wardrobe-grid">${list.map((o) => `<button class="outfit-card" data-fitting="${o.id}" aria-pressed="${outfit.id === o.id}"><img src="${portraitAsset(s.avatarId, o.id)}" alt="${esc(o.name)}" loading="lazy"><b>${esc(o.name)}</b><small>${g.ownedOutfits[s.avatarId].includes(o.id) ? "已擁有 · 點擊試穿" : `$${o.price.toLocaleString()} · 點擊試穿`}</small></button>`).join("")}</div></div>`,
    );
  }
  const fieldMap = {
    peopleSection: "peopleSection",
    npcArt: "npcArtView",
    npcProfileTab: "npcProfileTab",
    socialFilter: "socialFilter",
    chatTopic: "contactTopic",
    timelineFilter: "timelineFilter",
    galleryFilter: "galleryFilter",
    galleryItem: "gallerySelection",
    achievementFilter: "achievementFilter",
    forumCategory: "forumCategory",
    selectJob: "selectedJobId",
    selectAgency: "selectedAgencyId",
  };
  function handle(button) {
    const d = button.dataset;
    if (d.pixelApp || d.pocketOpen) {
      open(d.pixelApp || d.pocketOpen);
      return true;
    }
    if (d.pocketCategory || d.pocketDock || d.pocketDockItem) {
      const g = life().game;
      if (d.pocketCategory) g.appCategory = d.pocketCategory;
      if (d.pocketDock === "edit") {
        g.dockEditing = true;
        g.dockDraftIds = [...normalizeDockIds(g.dockAppIds)];
      }
      if (d.pocketDock === "cancel") {
        g.dockEditing = false;
        g.dockDraftIds = null;
      }
      if (d.pocketDock === "reset") g.dockDraftIds = [...DEFAULT_DOCK_IDS];
      if (d.pocketDockItem) {
        const ids = normalizeDockIds(g.dockDraftIds, { fallback: false }),
          i = ids.indexOf(d.pocketDockItem);
        if (i >= 0) ids.splice(i, 1);
        else if (ids.length < 6) ids.push(d.pocketDockItem);
        else {
          api.toast("先移除一個捷徑，再加入新功能");
          return true;
        }
        g.dockDraftIds = ids;
      }
      if (d.pocketDock === "save") {
        const ids = normalizeDockIds(g.dockDraftIds, { fallback: false });
        if (ids.length !== 6) return true;
        g.dockAppIds = ids;
        g.dockEditing = false;
        g.dockDraftIds = null;
      }
      open("phone");
      return true;
    }
    if (d.shopRoute !== undefined) {
      api.shopRoute();
      return true;
    }
    if (d.fitting) {
      fitting = d.fitting;
      wardrobe();
      return true;
    }
    if (d.fittingCancel !== undefined) {
      fitting = null;
      wardrobe();
      return true;
    }
    if (d.fittingFilter) {
      wardrobeFilter = d.fittingFilter;
      wardrobe();
      return true;
    }
    if (d.saveLook) {
      read((g) => saveLook(g, d.saveLook));
      save();
      wardrobe();
      return true;
    }
    if (!button.closest(".pixel-app")) return false;
    for (const [attr, key] of Object.entries(fieldMap))
      if (d[attr] !== undefined) {
        life().game[key] = d[attr];
        if (attr === "chatTopic") life().game.chatDraft = null;
        open(current);
        return true;
      }
    const npc = d.selectNpc || d.openCastNpc || d.sceneNpc;
    if (npc) {
      person(npc);
      return true;
    }
    if (d.chatOpen) {
      read(() => openConversation(d.chatOpen));
      open("people");
      const history = document.querySelector(".chat-history");
      if (history) history.scrollTop = history.scrollHeight;
      return true;
    }
    if (d.chatBack !== undefined) {
      life().game.peopleThread = null;
      open("people");
      return true;
    }
    if (d.socialComments) {
      mutate((g) => {
        g.socialExpandedPost =
          g.socialExpandedPost === d.socialComments ? null : d.socialComments;
      });
      return true;
    }
    if (d.forumLike) {
      mutate(() => toggleCommunityLike("forum", d.forumLike), button);
      return true;
    }
    if (d.forumThread) {
      mutate((g) => {
        g.forumThread = d.forumThread;
        g.forumDraft = "";
        g.forumReadIds ??= [];
        if (!g.forumReadIds.includes(d.forumThread))
          g.forumReadIds.push(d.forumThread);
        g.forumReadIds = g.forumReadIds.slice(-300);
      });
      return true;
    }
    const target = d.phoneOpen || d.openApp || d.timelineOpen;
    if (target) {
      if (d.npcId) person(d.npcId);
      else open(target);
      return true;
    }
    if (d.goFree !== undefined) {
      api.native.map();
      return true;
    }
    if (d.cityShortcut) {
      api.cityRoute(d.cityShortcut);
      return true;
    }
    if (d.partTimePlan) {
      api.planWork(d.partTimePlan);
      return true;
    }
    if (d.creativeNew) {
      mutate((g) => {
        const p = createCreativeProject(
          d.creativeNew,
          document.getElementById("creative-title")?.value,
        );
        if (p) g.creativeDraftTitle = "";
        return {
          message: p
            ? "作品草稿已建立，安排時間讓它成長"
            : "請先替作品取個名字",
        };
      });
      return true;
    }
    const creativeBookings = {
      creativeWork: "creative_work",
      creativeSubmit: "creative_submit",
      creativeSell: "creative_sale",
      creativeProduce: "creative_production",
      creativeRelease: "creative_release",
    };
    for (const [key, kind] of Object.entries(creativeBookings))
      if (d[key]) {
        api.book(kind, d[key], d.company);
        return true;
      }
    const projectId =
      d.creativeDirection ||
      d.creativeSelfProduce ||
      d.creativeTeam ||
      d.creativeRole ||
      d.creativeBudget ||
      d.creativeSelf;
    if (projectId) {
      mutate((g) => {
        const p = g.creativeProjects.find((x) => x.id === projectId);
        if (!p || g.endingResult || ["released", "sold"].includes(p.status))
          return { message: "這份作品目前不能再調整" };
        if (
          Object.values(g.scheduledActivities).some(
            (t) =>
              t.status === "scheduled" &&
              t.kind === "creative_production" &&
              t.payload.projectId === projectId,
          )
        )
          return { message: "先取消已排定的製作，再調整團隊與分工" };
        if (d.creativeDirection)
          return setCreativeDirection(projectId, d.direction);
        if (d.creativeSelfProduce)
          return chooseIndependentProduction(projectId);
        if (d.creativeTeam) return toggleCreativeCollaborator(projectId, d.npc);
        if (d.creativeBudget) return setCreativeBudget(projectId, d.tier);
        if (d.creativeRole) {
          const role = cycleCreativeRole(projectId, d.npc);
          return { message: role ? `分工調整為${role}` : "目前無法調整分工" };
        }
        return {
          message: toggleSelfParticipation(projectId)
            ? "改為親自參與演出與錄製"
            : "改為幕後主創",
        };
      });
      return true;
    }
    if (d.npcInteract) {
      api.book("npc", d.npcId, d.npcInteract);
      return true;
    }
    if (d.shortContact || d.romanceTalk) {
      mutate(() => {
        const r = d.shortContact
          ? shortContact(
              d.shortContact,
              d.contactType,
              d.contactTopic || null,
              life().game.chatDraft ?? null,
            )
          : requestRomanceConversation(d.romanceTalk);
        return r?.ok &&
          d.shortContact &&
          life().game.peopleThread === d.shortContact
          ? {
              ...r,
              message:
                d.contactType === "call"
                  ? "通話結束，聊天紀錄已收進對話。"
                  : "訊息已送出，對方的回覆在對話裡。",
            }
          : r;
      });
      if (d.shortContact && life().game.peopleThread === d.shortContact) {
        read(() => openConversation(d.shortContact));
        open("people");
        const history = document.querySelector(".chat-history");
        if (history) history.scrollTop = history.scrollHeight;
      }
      return true;
    }
    if (d.romanceAction) {
      if (d.romanceAction === "breakup")
        api.show(
          "relationship-confirm",
          `${api.heading("A PERSONAL DECISION", "確定要提出分手？", "這會改變彼此的關係，並留下共同的記憶。")}<div class="pixel-app"><button data-pixel-app="people">再想一想</button><button data-confirm-breakup="${d.npcId}">確認提出分手</button></div>`,
        );
      else mutate(() => setRomanceVisibility(d.npcId, d.romanceAction));
      return true;
    }
    if (d.confirmBreakup) {
      current = "people";
      mutate(() => breakUp(d.confirmBreakup));
      return true;
    }
    if (d.socialPost) {
      api.book("social_post", d.socialPost);
      return true;
    }
    if (d.socialLike) {
      mutate(() => toggleCommunityLike("social", d.socialLike), button);
      return true;
    }
    if (d.socialReply) {
      mutate(() => replyToNpcPost(d.socialReply, d.replyType));
      return true;
    }
    if (d.forumArchive !== undefined) {
      mutate((g) => {
        g.forumArchive = !g.forumArchive;
      });
      return true;
    }
    if (d.forumReact) {
      mutate((g) => forumReaction(g.forumThread, d.forumReact, g.forumDraft));
      return true;
    }
    if (d.forumRefresh !== undefined) {
      mutate((g) => {
        g.forumRefresh++;
        return { message: "已更新討論，目前顯示所有已發布的留言。" };
      });
      return true;
    }
    if (d.forumBack !== undefined || d.galleryBack !== undefined) {
      life().game[
        d.forumBack !== undefined ? "forumThread" : "gallerySelection"
      ] = null;
      open(current);
      return true;
    }
    if (d.timelineReadAll !== undefined) {
      mutate((g) => {
        for (const m of g.npcMessages) m.read = true;
      });
      return true;
    }
    if (d.timelineSearch !== undefined) {
      life().game.timelineQuery = document.querySelector(
        "[data-timeline-query]",
      ).value;
      open(current);
      return true;
    }
    if (d.clearPeopleQuery !== undefined) {
      life().game.peopleQuery = "";
      open(current);
      return true;
    }
    if (d.clearJobFilters !== undefined) {
      Object.assign(life().game, {
        jobQuery: "",
        jobStatusFilter: "all",
        jobSort: "deadline",
      });
      open(current);
      return true;
    }
    if (d.sequelSchedule) {
      api.book("sequel", d.sequelSchedule);
      return true;
    }
    if (d.jobAction) {
      if (["schedule-audition", "retry", "schedule"].includes(d.jobAction))
        api.book(d.jobAction === "schedule" ? "job" : "audition", d.jobId);
      else {
        const r = careerCommand(
          life(),
          d.jobAction === "sign" ? "sign-job" : "apply-job",
          d.jobId,
        );
        save();
        open(current);
        if (r?.message) api.toast(r.message);
      }
      return true;
    }
    if (d.agencyAction) {
      const id = life().game.selectedAgencyId || Object.keys(AGENCIES)[0];
      if (d.agencyAction === "schedule-interview") api.book("interview", id);
      else {
        const r = careerCommand(
          life(),
          {
            apply: "apply-agency",
            "accept-offer": "accept-agency",
            "decline-offer": "decline-agency",
          }[d.agencyAction],
          id,
        );
        save();
        open(current);
        if (r?.message) api.toast(r.message);
      }
      return true;
    }
    if (d.agencyRenew !== undefined) {
      const r = careerCommand(life(), "renew-agency");
      save();
      open(current);
      if (r?.message) api.toast(r.message);
      return true;
    }
    if (d.contractNegotiate) {
      mutate((g) =>
        negotiateAgencyTerms(
          AGENCIES[g.agencyOffer?.agencyId || g.selectedAgencyId],
          d.contractNegotiate,
        ),
      );
      return true;
    }
    if (d.managerAction) {
      api.book("manager_interact", d.managerAction);
      return true;
    }
    return false;
  }
  function input(event) {
    const d = event.target.dataset;
    if (d.chatDraft !== undefined || d.forumDraft !== undefined) {
      life().game[d.chatDraft !== undefined ? "chatDraft" : "forumDraft"] =
        event.target.value;
      return;
    }
    if (event.target.id === "creative-title") {
      life().game.creativeDraftTitle = event.target.value;
      return;
    }
    const fields = {
      pocketQuery: "appQuery",
      peopleQuery: "peopleQuery",
      forumQuery: "forumQuery",
      forumSort: "forumSort",
      timelineQuery: "timelineQuery",
      jobQuery: "jobQuery",
      jobSort: "jobSort",
      jobStatus: "jobStatusFilter",
    };
    if (d.fittingCategory !== undefined) {
      wardrobeCategory = event.target.value;
      wardrobe();
      return;
    }
    for (const [attr, key] of Object.entries(fields))
      if (d[attr] !== undefined) {
        life().game[key] = event.target.value;
        const selector = `[data-${attr.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}]`,
          position = event.target.selectionStart;
        open(current);
        const next = document.querySelector(selector);
        next?.focus();
        if (position != null) next?.setSelectionRange?.(position, position);
        return;
      }
  }
  return { open, person, wardrobe, handle, input };
}
