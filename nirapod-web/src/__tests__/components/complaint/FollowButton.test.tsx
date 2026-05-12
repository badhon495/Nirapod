import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { FollowButton } from "@/components/complaint/FollowButton";

// Sonner toast doesn't render in jsdom — mock it
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// next-auth session not needed by FollowButton itself
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "unauthenticated" }) }));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const COMPLAINT_ID = "complaint-123";

describe("FollowButton", () => {
  it("shows skeleton while loading", () => {
    render(<FollowButton complaintId={COMPLAINT_ID} />, { wrapper });
    // skeleton div is aria-hidden
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders Follow button when not following", async () => {
    render(<FollowButton complaintId={COMPLAINT_ID} />, { wrapper });
    await waitFor(() => screen.getByText("Follow"));
    expect(screen.getByRole("button", { name: /follow complaint/i })).toBeInTheDocument();
  });

  it("renders Following button after follow action", async () => {
    render(<FollowButton complaintId={COMPLAINT_ID} />, { wrapper });
    await waitFor(() => screen.getByText("Follow"));

    // Override handler to return following:true after POST
    server.use(
      http.get(`http://localhost:8080/api/v1/complaints/${COMPLAINT_ID}/follow`, () =>
        HttpResponse.json({ following: true, followerCount: 4 })
      )
    );

    await userEvent.click(screen.getByRole("button", { name: /follow complaint/i }));
    await waitFor(() => screen.getByText(/following/i));
  });

  it("shows follower count when > 0", async () => {
    render(<FollowButton complaintId={COMPLAINT_ID} />, { wrapper });
    await waitFor(() => screen.getByText("Follow"));
    // MSW handler returns followerCount: 3
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has aria-pressed false when not following", async () => {
    render(<FollowButton complaintId={COMPLAINT_ID} />, { wrapper });
    const btn = await screen.findByRole("button", { name: /follow complaint/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });
});
