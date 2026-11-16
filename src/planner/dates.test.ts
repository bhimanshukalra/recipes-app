/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";

import { addDays, toDateKey, weekDays, weekStart } from "./dates.ts";

test("weeks start on Monday", () => {
  assert.equal(weekStart("2026-11-16"), "2026-11-16"); // a Monday
  assert.equal(weekStart("2026-11-18"), "2026-11-16");
  assert.equal(weekStart("2026-11-22"), "2026-11-16"); // Sunday belongs to the week before
  assert.equal(weekStart("2026-11-23"), "2026-11-23");
});

test("adding days crosses months and years", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("weekDays gives seven consecutive days", () => {
  const days = weekDays("2026-11-30");
  assert.equal(days.length, 7);
  assert.equal(days[0], "2026-11-30");
  assert.equal(days[6], "2026-12-06");
});

test("toDateKey uses the local calendar date", () => {
  assert.equal(toDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});
