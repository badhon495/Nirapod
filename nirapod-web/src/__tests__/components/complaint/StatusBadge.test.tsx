import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge, UrgencyBadge } from "@/components/complaint/StatusBadge";

describe("StatusBadge", () => {
  it("renders UNSOLVED status", () => {
    render(<StatusBadge status="UNSOLVED" />);
    expect(screen.getByText("Unsolved")).toBeInTheDocument();
  });

  it("renders IN_PROGRESS status", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders SOLVED status", () => {
    render(<StatusBadge status="SOLVED" />);
    expect(screen.getByText("Solved")).toBeInTheDocument();
  });
});

describe("UrgencyBadge", () => {
  it("renders LOW urgency", () => {
    render(<UrgencyBadge urgency="LOW" />);
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("renders MEDIUM urgency", () => {
    render(<UrgencyBadge urgency="MEDIUM" />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("renders HIGH urgency", () => {
    render(<UrgencyBadge urgency="HIGH" />);
    const el = screen.getByText("High");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("red");
  });
});
