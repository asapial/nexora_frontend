import assert from "node:assert/strict";
import test from "node:test";
import { remainingInactivityMs } from "./inactivity.ts";
import { resolveReducedMotion } from "./motion.ts";
import { MascotTimer, type MascotTimerClock } from "./timer.ts";

class FakeClock implements MascotTimerClock {
  time = 0;
  private nextId = 0;
  private tasks = new Map<number, { at: number; callback: () => void }>();

  now() { return this.time; }
  set(callback: () => void, delayMs: number) {
    const id = ++this.nextId;
    this.tasks.set(id, { at: this.time + delayMs, callback });
    return id;
  }
  clear(handle: unknown) { this.tasks.delete(Number(handle)); }
  advance(delayMs: number) {
    this.time += delayMs;
    const ready = [...this.tasks.entries()].filter(([, task]) => task.at <= this.time);
    ready.forEach(([id, task]) => {
      this.tasks.delete(id);
      task.callback();
    });
  }
}

test("temporary reactions return through a scheduled timer", () => {
  const clock = new FakeClock();
  const timer = new MascotTimer(clock);
  let state = "success";
  timer.schedule(700, () => { state = "idle"; });
  clock.advance(699);
  assert.equal(state, "success");
  clock.advance(1);
  assert.equal(state, "idle");
});

test("timer cleanup prevents callbacks after unmount", () => {
  const clock = new FakeClock();
  const timer = new MascotTimer(clock);
  let calls = 0;
  timer.schedule(800, () => { calls += 1; });
  timer.cancel();
  clock.advance(1000);
  assert.equal(calls, 0);
  assert.equal(timer.pending, false);
});

test("speech timeout pauses and resumes with the remaining duration", () => {
  const clock = new FakeClock();
  const timer = new MascotTimer(clock);
  let dismissed = false;
  timer.schedule(3000, () => { dismissed = true; });
  clock.advance(1000);
  timer.pause();
  clock.advance(5000);
  assert.equal(dismissed, false);
  timer.resume();
  clock.advance(1999);
  assert.equal(dismissed, false);
  clock.advance(1);
  assert.equal(dismissed, true);
});

test("reduced-motion override wins over the operating system", () => {
  assert.equal(resolveReducedMotion(true, null), true);
  assert.equal(resolveReducedMotion(false, true), true);
  assert.equal(resolveReducedMotion(true, false), false);
});

test("inactivity timing reaches sleep at the configured boundary", () => {
  assert.equal(remainingInactivityMs(1000, 2000, 3000), 2000);
  assert.equal(remainingInactivityMs(1000, 4000, 3000), 0);
  assert.equal(remainingInactivityMs(1000, 5000, 3000), 0);
});
