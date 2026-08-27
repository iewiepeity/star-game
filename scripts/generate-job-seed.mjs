// 由 src/data/jobs-catalog.js 產生可重複執行的 Supabase 種子 SQL。
// 使用方式：node scripts/generate-job-seed.mjs
import{JOB_CATALOG}from"../src/data/jobs-catalog.js";

const rows=JOB_CATALOG.map((item,index)=>({
 id:item.id,
 category:item.category,
 stars:item.stars,
 client:item.client,
 title:item.title,
 tagline:item.tagline,
 synopsis:item.synopsis,
 pay:item.pay,
 sessions:item.sessions,
 work_days:item.workDays,
 deadline_weeks:item.deadlineWeeks,
 min_training_sessions:item.minTrainingSessions,
 requirements:item.requirements.map(([name,min])=>({name,min})),
 soft_traits:item.softTraits,
 reputation_signals:item.reputationSignals,
 rewards:item.rewards,
 audition:item.audition,
 sort_order:index+1
}));

const payload=JSON.stringify(rows,null,2);
const sql=`-- Generated from src/data/jobs-catalog.js. Do not edit the rows by hand.\ninsert into public.job_catalog (id,category,stars,client,title,tagline,synopsis,pay,sessions,work_days,deadline_weeks,requirements,soft_traits,reputation_signals,rewards,audition,sort_order)\nselect id,category,stars,client,title,tagline,synopsis,pay,sessions,work_days,deadline_weeks,requirements,soft_traits,reputation_signals,rewards,audition,sort_order\nfrom jsonb_to_recordset($job_catalog$${payload}$job_catalog$::jsonb) as item(\n id text, category text, stars smallint, client text, title text, tagline text, synopsis text,\n pay bigint, sessions smallint, work_days smallint[], deadline_weeks smallint, requirements jsonb,\n soft_traits text[], reputation_signals text[], rewards jsonb, audition jsonb, sort_order smallint\n)\non conflict (id) do update set\n category=excluded.category, stars=excluded.stars, client=excluded.client, title=excluded.title,\n tagline=excluded.tagline, synopsis=excluded.synopsis, pay=excluded.pay, sessions=excluded.sessions,\n work_days=excluded.work_days, deadline_weeks=excluded.deadline_weeks, requirements=excluded.requirements,\n soft_traits=excluded.soft_traits, reputation_signals=excluded.reputation_signals, rewards=excluded.rewards,\n audition=excluded.audition, sort_order=excluded.sort_order, is_active=true, updated_at=now();\n`;

const finalSql=sql
 .replaceAll("deadline_weeks,requirements","deadline_weeks,min_training_sessions,requirements")
 .replace("deadline_weeks smallint, requirements","deadline_weeks smallint, min_training_sessions smallint, requirements")
 .replace("deadline_weeks=excluded.deadline_weeks, requirements","deadline_weeks=excluded.deadline_weeks, min_training_sessions=excluded.min_training_sessions, requirements");
process.stdout.write(finalSql);
