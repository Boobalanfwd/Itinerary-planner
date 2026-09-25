import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge single and multiple class names cleanly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should properly merge conflicting Tailwind classes", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("should ignore falsy, null, and undefined values", () => {
    expect(cn("text-base", false && "hidden", null, undefined, "font-bold")).toBe(
      "text-base font-bold"
    );
  });
});
