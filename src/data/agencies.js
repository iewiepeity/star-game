// 資料層：經紀公司清單。門檻、合約條件皆放在資料內，未來新增公司只需擴充此表，不需複製 UI 邏輯。
// 資格判定與狀態變化見 logic/agency.js；畫面見 views/agency.js（皆只讀這份資料，不在此檔案做任何邏輯判斷）。
export const AGENCIES={
 starlight:{
  id:"starlight",
  name:"星光藝能",
  shortName:"星光",
  type:"綜合型經紀公司",
  scale:"中型公司",
  description:"星望市歷史最久的中型經紀公司之一，戲劇、廣告與綜藝資源均衡，重視新人的長期栽培而非速成流量。",
  specialties:["戲劇","廣告","綜藝"],
  requirements:{contractReadiness:20,abilities:[["鏡頭感",60],["親和力",50]]},
  contract:{durationWeeks:104,commissionRate:.2,description:"兩年新人合約，公司提供資源培訓與通告引薦"}
 }
};
export const AGENCY_LIST=Object.values(AGENCIES);
