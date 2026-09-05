// Entry-level support shifts, not acting contracts or auditions.
export const COMPANY_PART_TIME = {
  tv_assistant: { companyId: "starlight_tv", venue: "tv_company", label: "星曜電視台・棚務助理", short: "電視台打工", note: "核對道具、引導來賓與收整攝影棚", income: [1400, 1700], fatigue: 12, shiftGains: [["口才", 1, 2]] },
  film_runner: { companyId: "aurora_film", venue: "film_company", label: "極光影業・片場場務", short: "影業打工", note: "搬運輕型器材、整理場記資料與現場跑腿", income: [1500, 1800], fatigue: 14, shiftGains: [["肢體表現", 1, 2]] },
  record_archive: { companyId: "echo_records", venue: "record_company", label: "迴響唱片・製作行政", short: "唱片公司打工", note: "整理 Demo、核對曲目資料與協助錄音預約", income: [1300, 1600], fatigue: 9, shiftGains: [["學識", 1, 2]] },
  media_runner: { companyId: "prism_media", venue: "media_company", label: "稜鏡製作・拍攝助理", short: "製作公司打工", note: "整理拍攝樣品、協助走位標記與現場收整", income: [1400, 1700], fatigue: 11, shiftGains: [["鏡頭感", 1, 2]] },
};
