import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ComplaintCard } from "@/components/complaint/ComplaintCard";
import type { ComplaintSummary } from "@/types/complaint";

// next/link renders an <a> in jsdom
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseComplaint: ComplaintSummary = {
  id: "complaint-123",
  trackingId: 1001,
  reporterName: "Test User",
  reporterId: "user-1",
  category: "POLICE",
  urgency: "HIGH",
  status: "UNSOLVED",
  title: "Suspicious activity near market",
  district: "Dhaka",
  area: "Mirpur",
  isPublic: true,
  tags: ["robbery"],
  photoCount: 2,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

describe("ComplaintCard", () => {
  it("renders complaint title", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("Suspicious activity near market")).toBeInTheDocument();
  });

  it("renders district and area", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("Mirpur, Dhaka")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("Unsolved")).toBeInTheDocument();
  });

  it("renders urgency badge", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders category label", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("Police")).toBeInTheDocument();
  });

  it("links to complaint detail page", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/complaint/complaint-123");
  });

  it("shows photo count when photos exist", () => {
    render(<ComplaintCard complaint={baseComplaint} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders SOLVED complaint without errors", () => {
    const solved = { ...baseComplaint, status: "SOLVED" as const };
    render(<ComplaintCard complaint={solved} />);
    expect(screen.getByText("Solved")).toBeInTheDocument();
  });
});
