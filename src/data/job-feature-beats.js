import { AUTHORED_JOB_CONTENT } from "./job-authored-content.js";
// 保留J036–J060共25份特色通告；不再以類型開工／收尾模板補足。
export const FEATURE_JOB_BEATS=Object.freeze(Object.fromEntries(
 Object.entries(AUTHORED_JOB_CONTENT).filter(([id])=>Number(id.slice(1))>=36&&Number(id.slice(1))<=60).map(([id,item])=>[id,Object.freeze({
  friction:item.production[1],pivot:item.production[2],echo:item.legacy
 })])
));
export const FEATURE_JOB_IDS=Object.freeze(Object.keys(FEATURE_JOB_BEATS));
export const isFeatureJob=id=>Object.hasOwn(FEATURE_JOB_BEATS,id);
