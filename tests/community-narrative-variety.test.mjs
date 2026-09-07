import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { NPCS } from "../src/data/npcs.js";
import { FORUM_CATEGORIES } from "../src/data/forum.js";
import { COMMUNITY_THREADS, OFFICIAL_SOCIAL_STORIES } from "../src/data/community-stories.js";
import { NPC_SOCIAL_STORIES } from "../src/data/npc-social-stories.js";
import { INDUSTRY_COLUMNS } from "../src/data/industry-stories.js";
import { allThreads, repliesFor } from "../src/logic/forum-feed.js";
import { officialSocialPosts, weeklyForumThreads } from "../src/logic/community-rotation.js";
import { npcSocialPost, contextualReplyOptions } from "../src/logic/social-context.js";
import { socialDrafts } from "../src/logic/social-drafts.js";
import { socialApp } from "../src/views/social.js";
import { toggleCommunityLike } from "../src/logic/community-likes.js";
import { forumReaction } from "../src/logic/community-interactions.js";
import { generateIndustryNews } from "../src/logic/industry-news.js";
import { resolvePersonalTask } from "../src/logic/personal-tasks.js";
import { tickPublicOpinion } from "../src/logic/reputation-engine.js";

function fresh() { resetState(); state.name = "測試星"; }

test("weekly forum discussions keep all categories alive, rotate for 40 weeks, and preserve dated comment/like identities", () => {
  fresh();
  assert.ok(COMMUNITY_THREADS.length >= 40);
  const titles = new Set();
  for (let week = 2; week <= 41; week++) {
    state.week = week;
    const current = weeklyForumThreads().find(thread => thread.week === week);
    titles.add(current.title);
    assert.equal(new Set(current.replies).size, current.replies.length);
    assert.ok(current.replies.length >= 3);
    if (week >= 6) assert.deepEqual(new Set(allThreads().map(thread => thread.category)), new Set(FORUM_CATEGORIES));
  }
  assert.equal(titles.size, 40);
  state.week = 20;
  const thread = allThreads().find(item => item.week === 20);
  const before = structuredClone(state);
  const first = allThreads();
  assert.deepEqual(allThreads(), first);
  assert.deepEqual(state, before);
  assert.equal(toggleCommunityLike("forum", repliesFor(thread)[0].id).ok, true);
  assert.equal(forumReaction(thread.id, "reason").ok, true);
  const comment = structuredClone(state.forumComments.at(-1));
  state.week += 1;
  assert.deepEqual(allThreads().find(item => item.id === thread.id), thread);
  hydrateState(structuredClone(state));
  assert.ok(state.likedForumItems.includes(repliesFor(thread)[0].id));
  assert.deepEqual(state.forumComments.find(item => item.id === comment.id), comment);
  state.week = 30;
  assert.equal(allThreads().some(item => item.id === thread.id), false);
  state.forumArchive = true;
  assert.deepEqual(allThreads().find(item => item.id === thread.id), thread);
});

test("official social posts refresh on week boundaries, keep previous hearts, and actually appear in the full feed", () => {
  fresh();
  const texts = new Set();
  for (let week = 1; week <= OFFICIAL_SOCIAL_STORIES.length; week++) {
    state.week = week;
    texts.add(officialSocialPosts()[0].text);
  }
  assert.equal(texts.size, 24);
  state.week = 10;
  const current = officialSocialPosts()[0];
  const before = structuredClone(state);
  assert.deepEqual(officialSocialPosts(), officialSocialPosts());
  assert.deepEqual(state, before);
  assert.equal(toggleCommunityLike("social", current.id).ok, true);
  state.week = 11;
  assert.deepEqual(officialSocialPosts().find(post => post.id === current.id), current);
  hydrateState(structuredClone(state));
  assert.ok(state.likedSocialPosts.includes(current.id));
  const html = socialApp();
  assert.ok(html.includes(current.text));
  assert.ok(html.includes(`data-post-id="${current.id}"`));
});

test("each NPC has thirteen distinct weekly posts, stable replies, and safe legacy photo fallback", () => {
  fresh();
  for (const id of Object.keys(NPCS)) {
    assert.equal(NPC_SOCIAL_STORIES[id].length, 12);
    const texts = new Set();
    for (let week = 1; week <= 13; week++) {
      state.week = week;
      texts.add(npcSocialPost(id).text);
      const before = structuredClone(state);
      assert.deepEqual(contextualReplyOptions(id), contextualReplyOptions(id));
      assert.deepEqual(state, before);
    }
    assert.equal(texts.size, 13, id);
  }
  assert.equal(npcSocialPost("missing-person"), null);
  state.week = 1;
  state.cityLife = { photos: [{ npcId: "jiqing", published: true, day: 0 }] };
  assert.ok(npcSocialPost("jiqing"));
  assert.doesNotMatch(npcSocialPost("jiqing").text, /同意分享/);
  state.npcCareerHistory = [{ week: 1, updates: [`${NPCS.jiqing.name}的職涯明顯往上走了一階`] }];
  assert.match(npcSocialPost("jiqing").text, /職涯明顯往上走了一階/);
  state.week = 2;
  assert.doesNotMatch(npcSocialPost("jiqing").text, /職涯明顯往上走了一階/);
});

test("player drafts rotate over twenty-four weeks and scheduled text remains exactly as chosen", () => {
  fresh();
  const texts = { training: new Set(), daily: new Set(), work: new Set() };
  for (let week = 1; week <= 24; week++) {
    state.week = week;
    const drafts = socialDrafts();
    for (const key of Object.keys(texts)) texts[key].add(drafts[key].text);
    // Regular posting must not halve the cycle by adding the lifetime post count to the week.
    state.socialPosts.push({ id: `historic-${week}`, week, text: drafts.daily.text });
  }
  for (const pool of Object.values(texts)) assert.equal(pool.size, 24);
  const chosen = socialDrafts().daily.text;
  state.week++;
  assert.equal(resolvePersonalTask({ kind: "social_post", payload: { type: "daily", text: chosen, label: "分享日常" } }).ok, true);
  assert.equal(state.socialPosts[0].text, chosen);
  const fallback = socialDrafts().training.text;
  assert.equal(resolvePersonalTask({ kind: "social_post", payload: { type: "training" } }).ok, true);
  assert.equal(state.socialPosts[0].text, fallback);
  assert.notEqual(state.socialPosts[0].comments[0].text, state.socialPosts[1].comments[0].text);
});

test("industry columns rotate for thirty weeks, do not fabricate player events, and add no public-opinion heat", () => {
  fresh();
  const columns = new Set();
  for (let week = 1; week <= 30; week++) {
    state.week = week;
    const made = generateIndustryNews();
    assert.equal(made.length, 1);
    assert.equal(made[0].subject, "industry");
    columns.add(made[0].title);
    assert.deepEqual(generateIndustryNews(), []);
  }
  assert.equal(columns.size, INDUSTRY_COLUMNS.length);
  const baseline = structuredClone(state);
  const without = structuredClone(tickPublicOpinion([]));
  hydrateState(baseline);
  assert.deepEqual(tickPublicOpinion([{ heat: 0, subject: "industry", editorial: true }]), without);
});

test("capped industry archive generates distinct IDs for same-week events and remains idempotent", () => {
  fresh();
  state.week = 21;
  state.industryNews = Array.from({ length: 80 }, (_, index) => ({ id: `old-${index}`, key: `old-${index}`, week: 1 }));
  state.creativeProjects = [{ id: "original-one", title: "發行作品", category: "歌曲", status: "released", releaseWeek: 21, marketScore: 77 }];
  state.completedWorks = [{ id: "finished-one", title: "完成作品", category: "電影", completedWeek: 21, quality: 68 }];
  const options = { npcUpdates: [`${NPCS.jiqing.name}近期作品獲得業界肯定`, `${NPCS.sufei.name}的職涯明顯往上走了一階`] };
  assert.equal(generateIndustryNews(options).length, 5);
  assert.equal(state.industryNews.length, 80);
  assert.equal(new Set(state.industryNews.map(item => item.id)).size, 80);
  assert.deepEqual(generateIndustryNews(options), []);
  assert.ok(state.industryNews.find(item => item.key === "work:finished-one").body.includes("作品品質 68"));
  assert.ok(state.industryNews.find(item => item.key === "creative:original-one:21").body.includes("市場評分 77"));
});
