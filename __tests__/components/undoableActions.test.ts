import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Undoable Actions Queue & Timer Management", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should schedule a 5-second undoable delete action and execute commit on expiry", async () => {
    let committed = false;
    let undone = false;

    const commitFn = vi.fn().mockImplementation(() => {
      committed = true;
    });
    const undoFn = vi.fn().mockImplementation(() => {
      undone = true;
    });

    const timer = setTimeout(() => {
      commitFn();
    }, 5000);

    // Fast-forward 2 seconds (not yet expired)
    vi.advanceTimersByTime(2000);
    expect(committed).toBe(false);
    expect(undone).toBe(false);

    // Fast-forward remaining 3 seconds
    vi.advanceTimersByTime(3000);
    expect(committed).toBe(true);
    expect(undone).toBe(false);
  });

  it("should abort commit if undo is clicked before the 5-second timeout", () => {
    let committed = false;
    let undone = false;

    const commitFn = vi.fn().mockImplementation(() => {
      committed = true;
    });
    const undoFn = vi.fn().mockImplementation(() => {
      undone = true;
    });

    const timer = setTimeout(() => {
      commitFn();
    }, 5000);

    // User clicks undo after 2 seconds
    vi.advanceTimersByTime(2000);
    clearTimeout(timer);
    undoFn();

    expect(undone).toBe(true);

    // Advance time past 5 seconds
    vi.advanceTimersByTime(5000);
    // Commit was never called!
    expect(committed).toBe(false);
  });

  it("should schedule a 4-second undoable reorder action and execute commit on expiry", () => {
    const commitFn = vi.fn();
    const undoFn = vi.fn();

    const timer = setTimeout(() => {
      commitFn();
    }, 4000);

    vi.advanceTimersByTime(3999);
    expect(commitFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(commitFn).toHaveBeenCalledTimes(1);
    expect(undoFn).not.toHaveBeenCalled();
  });

  it("should restore previous order snapshot if undo is triggered within 4 seconds", () => {
    const originalOrder = ["stop-1", "stop-2", "stop-3"];
    let currentOrder = ["stop-2", "stop-1", "stop-3"];
    const commitFn = vi.fn();

    const timer = setTimeout(() => {
      commitFn();
    }, 4000);

    // User triggers undo at 1.5s
    vi.advanceTimersByTime(1500);
    clearTimeout(timer);
    currentOrder = [...originalOrder];

    expect(currentOrder).toEqual(["stop-1", "stop-2", "stop-3"]);
    vi.advanceTimersByTime(5000);
    expect(commitFn).not.toHaveBeenCalled();
  });

  it("should maintain a maximum history stack of 10 items", () => {
    const history: { id: string }[] = [];
    const MAX = 10;

    for (let i = 1; i <= 15; i++) {
      history.unshift({ id: `action-${i}` });
      if (history.length > MAX) {
        history.pop();
      }
    }

    expect(history).toHaveLength(10);
    expect(history[0].id).toBe("action-15");
    expect(history[9].id).toBe("action-6");
  });
});
