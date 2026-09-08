import { test } from "node:test";
import assert from "node:assert/strict";
import { initialLife } from "../src/pixel/life.js";
import { nextPlanningDay } from "../src/pixel/planner-tools.js";

test("連排保護正式通告、作客、城市約定；週末不繞回已排日期", () => {
  const life = initialLife("mobile-planner");
  life.day = 2;
  life.plan[3] = { id: "career_task" };
  life.plan[4] = { id: "home_host" };
  life.plan[5] = { id: "city_date", appointmentId: "appointment" };
  assert.equal(nextPlanningDay(life, 0), 2);
  assert.equal(nextPlanningDay(life, 2), 6);
  assert.equal(nextPlanningDay(life, 6), 6);
  life.pending = { phase: "performing" };
  assert.equal(nextPlanningDay(life, 0), 6);
});
