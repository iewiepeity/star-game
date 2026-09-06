import { AUTHORED_JOB_CONTENT } from "./job-authored-content.js";
// 保留原35份基礎通告ID與消費端契約，正文改由完整手寫因果鏈提供。
export const FOUNDATION_JOB_BEATS=Object.freeze(Object.fromEntries(
 Object.entries(AUTHORED_JOB_CONTENT).filter(([id])=>Number(id.slice(1))<=35).map(([id,item])=>[id,Object.freeze({
  friction:item.production[1],pivot:item.production[2],echo:item.legacy
 })])
));
export const isFoundationFeatureJob=id=>Object.hasOwn(FOUNDATION_JOB_BEATS,id);
