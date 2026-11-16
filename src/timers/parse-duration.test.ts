/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatClock } from "./format.ts";
import { findDurations } from "./parse-duration.ts";

const seconds = (text: string) => findDurations(text).map((d) => d.seconds);

test("finds common times", () => {
  assert.deepEqual(seconds("Simmer for 10 minutes."), [600]);
  assert.deepEqual(seconds("Bake for 45 mins until golden."), [2700]);
  assert.deepEqual(seconds("Rest 1 hour."), [3600]);
  assert.deepEqual(seconds("Whisk for 30 seconds."), [30]);
});

test("understands fractions, decimals and number words", () => {
  assert.deepEqual(seconds("Chill for 1½ hours."), [5400]);
  assert.deepEqual(seconds("Cook 2.5 minutes."), [150]);
  assert.deepEqual(seconds("Leave for an hour."), [3600]);
  assert.deepEqual(seconds("Boil for five minutes."), [300]);
});

test("a range counts down the shorter time and keeps the text as written", () => {
  const [range] = findDurations("Bake for 25-30 minutes.");
  assert.equal(range.seconds, 1500);
  assert.equal(range.label, "25-30 minutes");
  assert.deepEqual(seconds("Bake 25 to 30 minutes"), [1500]);
});

test("hours and minutes together are one timer", () => {
  assert.deepEqual(seconds("Roast for 1 hour 30 minutes."), [5400]);
  assert.deepEqual(seconds("Roast for 1 hour and 15 minutes."), [4500]);
  assert.deepEqual(seconds("Chill 2 hours, then bake 20 minutes."), [7200, 1200]);
});

test("ignores steps with no time and things that only look like one", () => {
  assert.deepEqual(seconds("Mix everything well."), []);
  assert.deepEqual(seconds("Heat oven to 180C/160C fan/gas 4."), []);
  assert.deepEqual(seconds("Use a 2lb loaf tin."), []);
  assert.deepEqual(seconds("Wait 2 seconds."), []);
});

test("formatClock", () => {
  assert.equal(formatClock(452), "7:32");
  assert.equal(formatClock(3900), "1:05:00");
  assert.equal(formatClock(0.2), "0:01");
  assert.equal(formatClock(-3), "0:00");
});
