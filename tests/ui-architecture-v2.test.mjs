import test from "node:test";
import assert from "node:assert/strict";
import { setUndo, peekUndo, consumeUndo } from "../src/core/undo.js";
import { initialState } from "../src/core/state.js";
import { validateGameState } from "../src/core/save-schema.js";


test("UI 搜尋與分類狀態可通過存檔驗證", () => {
  const value = initialState();
  value.jobQuery = "電影";
  value.jobStatusFilter = "action";
  value.peopleQuery = "導演";
  value.appQuery = "工作";
  value.appCategory = "事業";
  assert.equal(validateGameState(value).ok, true);
});

test("Undo action 只能消耗一次且綁定原訊息", () => {
  let restored = false;
  setUndo("本週已全部改為休息", () => { restored = true; });
  assert.equal(peekUndo("其他通知"), null);
  const action = consumeUndo("本週已全部改為休息");
  action.run();
  assert.equal(restored, true);
  assert.equal(consumeUndo("本週已全部改為休息"), null);
});
