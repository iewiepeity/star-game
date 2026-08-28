export const ACHIEVEMENTS=[
{id:"first_week",icon:"☀",category:"旅程",title:"第一週，完成",description:"完成第一週的七日行程。",target:1,value:s=>s.history?.length||0},
{id:"training_beginner",icon:"✦",category:"成長",title:"練習生報到",description:"累積完成 10 次訓練。",target:10,value:s=>s.trainingSessionsCompleted||0},
{id:"first_audition",icon:"★",category:"工作",title:"站到鏡頭前",description:"完成第一次正式通告試鏡。",target:1,value:s=>s.jobHistory?.filter(x=>x.type==="audition").length||0},
{id:"first_work",icon:"🎬",category:"工作",title:"名字上字幕",description:"完成第一部正式作品。",target:1,value:s=>s.completedWorks?.length||0},
{id:"works_five",icon:"▤",category:"工作",title:"作品開始說話",description:"累積完成 5 部作品。",target:5,value:s=>s.completedWorks?.length||0},
{id:"first_award",icon:"♛",category:"職涯",title:"掌聲響起",description:"獲得第一座獎項。",target:1,value:s=>s.awards?.length||0},
{id:"fame_500",icon:"◇",category:"職涯",title:"街頭巷尾",description:"知名度達到 500。",target:500,value:s=>s.fame||0},
{id:"fans_100k",icon:"♡",category:"職涯",title:"十萬份心意",description:"粉絲人數達到 100,000。",target:100000,value:s=>s.fans||0},
{id:"first_original",icon:"✎",category:"創作",title:"自己的名字",description:"正式發行第一部原創作品。",target:1,value:s=>s.creativeProjects?.filter(x=>x.status==="released").length||0},
{id:"contacts_five",icon:"☎",category:"人際",title:"不再是空白通訊錄",description:"認識 5 位 NPC。",target:5,value:s=>s.knownPeople?.length||0},
{id:"first_partner",icon:"♥",category:"人際",title:"兩個人的秘密",description:"與一位 NPC 正式交往。",target:1,value:s=>Object.values(s.relationships||{}).some(r=>["dating","committed","engaged","married"].includes(r.romance))?1:0},
{id:"married",icon:"∞",category:"人際",title:"星途同行",description:"與伴侶結婚。",target:1,hidden:true,value:s=>Object.values(s.relationships||{}).some(r=>r.romance==="married")?1:0},
{id:"conflict",icon:"⚡",category:"人際",title:"不是每次相遇都美好",description:"與一位 NPC 的關係進入交惡。",target:1,value:s=>Object.values(s.relationships||{}).some(r=>(r.hostility||0)>=45)?1:0},
{id:"wealthy",icon:"$",category:"生活",title:"終於不用看存摺嘆氣",description:"持有資金達到 $1,000,000。",target:1000000,value:s=>s.money||0},
{id:"hospital",icon:"☁",category:"生活",title:"身體不是消耗品",description:"曾因疲勞過高被迫住院。",target:1,hidden:true,value:s=>s.flags?.some(x=>x.label==="疲勞住院")?1:0}
];
export const ACHIEVEMENT_BY_ID=Object.fromEntries(ACHIEVEMENTS.map(x=>[x.id,x]));
