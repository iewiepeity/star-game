// 舊版單一通告流程的相容匯出。目前先由 50 份內容庫的 J001 驅動，之後多通告狀態機可直接改用 JOB_BY_ID。
import{JOB_BY_ID}from"./jobs-catalog.js";

const source=JOB_BY_ID.J001;
export const JOB={...source,brand:source.client};
