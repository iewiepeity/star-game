// Fixed-seed rest-only longevity audit; checks the pixel clock and ending, not career balance.
import {
  initialLife,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
} from "../src/pixel/life.js";
import { currentStory, chooseStory } from "../src/pixel/career.js";
const l = initialLife("five-years-pixel");
for (let week = 1; week <= 260; week++) {
  const story = currentStory(l);
  if (story?.event) chooseStory(l, story.choices[0]?.id);
  l.game.eventOutcome = null;
  for (let day = 0; day < 7; day++) {
    const p = beginDay(l, { id: "rest" });
    if (p.error) throw Error(p.error);
    settleDay(l);
    advanceDay(l);
  }
  nextWeek(l);
  if (week % 52 === 0)
    process.stdout.write(
      JSON.stringify({
        week: l.game.week,
        bytes: Buffer.byteLength(JSON.stringify(l)),
        ending: l.game.endingResult?.title,
      }) + "\n",
    );
}
if (!l.game.endingResult) throw Error("missing ending");
