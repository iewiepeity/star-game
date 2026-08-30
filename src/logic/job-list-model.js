export function sortJobs(jobs,sort="deadline"){
 const items=[...jobs];
 if(sort==="stars")items.sort((a,b)=>b.stars-a.stars||a.title.localeCompare(b.title,"zh-Hant"));
 else if(sort==="title")items.sort((a,b)=>a.title.localeCompare(b.title,"zh-Hant"));
 return items;
}
