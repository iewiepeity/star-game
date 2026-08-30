const art=(file,alt,position="center")=>Object.freeze({src:`./assets/work-art/${file}`,alt,position});

export const WORK_ART=Object.freeze({
 J041:art("J041-stadium-tour.webp","全球巨蛋巡演主秀的萬人舞臺"),
 J042:art("J042-north-coast.webp","北海岸電影外景與遠方燈塔"),
 J043:art("J043-river-of-time.webp","跨越四十年時光的史詩河岸"),
 J044:art("J044-one-world-house.webp","世界共居實境節目的玻璃屋"),
 J045:art("J045-luxury-ambassador.webp","全球精品大使的高級訂製形象"),
 J046:art("J046-world-tour-album.webp","原創專輯連結世界巡演的舞臺"),
 J047:art("J047-skyline-project.webp","天際線計畫的城市高空任務"),
 J048:art("J048-thirteenth-letter.webp","第十三封信與破碎記憶的檔案室"),
 J049:art("J049-new-year-live.webp","跨年國家級直播的城市主舞臺"),
 J050:art("J050-global-airline.webp","晨光機場中的全球航空形象"),
});

export const workArtFor=jobOrId=>WORK_ART[typeof jobOrId==="string"?jobOrId:jobOrId?.jobId||jobOrId?.id]||null;
