import { state } from "../core/state.js";
import { OFFICIAL_SOCIAL_POSTS } from "../data/social.js";
import { OFFICIAL_SOCIAL_STORIES, COMMUNITY_THREADS } from "../data/community-stories.js";

export function communityHash(value) {
  return [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
}
export function weeklyCopy(pool, key, week = state.week) {
  return pool[(Math.max(1, Math.floor(week || 1)) - 1 + communityHash(key)) % pool.length];
}

export function officialSocialPosts(game = state) {
  const week = Math.max(1, Math.floor(game.week || 1));
  // Keep three dated posts as a timeline; a post's text and heart ID do not change on refresh.
  const posts = [];
  for (let publishedWeek = week; publishedWeek >= Math.max(1, week - 2); publishedWeek--) {
    const post = OFFICIAL_SOCIAL_STORIES[(publishedWeek - 1) % OFFICIAL_SOCIAL_STORIES.length];
    posts.push({ ...post, id: `${post.id}-w${publishedWeek}`, week: publishedWeek });
  }
  return [...posts, ...OFFICIAL_SOCIAL_POSTS.slice(0, Math.max(0, 3 - posts.length)).map(post => ({ ...post, week: 1 }))];
}

export function weeklyForumThreads(game = state) {
  const week = Math.max(1, Math.floor(game.week || 1));
  const threads = [];
  // Existing launch-day threads stay in week 1. New community discussions begin in week 2.
  for (let publishedWeek = game.forumArchive ? 2 : Math.max(2, week - 4); publishedWeek <= week; publishedWeek++) {
    const thread = COMMUNITY_THREADS[(publishedWeek - 2) % COMMUNITY_THREADS.length];
    threads.push({ ...thread, id: `${thread.id}-w${publishedWeek}`, week: publishedWeek, background: true });
  }
  return threads;
}
