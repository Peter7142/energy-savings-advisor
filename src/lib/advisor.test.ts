import { describe, it, expect } from "vitest";
import { compare, annualCost } from "./advisor";

const t = (unit: number, fee = 0) => ({ supplier: "X", product: "P", unit, fee, source: null });

describe("advisor", () => {
  it("annual cost = kWh × price + 12 × monthly fee", () => {
    expect(annualCost(2000, 0.15, 2)).toBe(324);
  });
  it("over 10 % overpay is overpriced", () => {
    expect(compare(2000, 0.2, 0, [t(0.15)]).verdict).toBe("overpriced");
  });
  it("under 3 % difference is good", () => {
    expect(compare(2000, 0.15, 0, [t(0.149)]).verdict).toBe("good");
  });
  it("no verified tariffs gives unknown", () => {
    expect(compare(2000, 0.2, 0, []).verdict).toBe("unknown");
  });
});
