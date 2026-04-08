import { screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import { renderWithRouter } from "@/test/test-utils";

const useAuthMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("route guards", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("redirects anonymous users away from protected customer routes", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
    });

    renderWithRouter(<ProtectedRoute><div>Orders Page</div></ProtectedRoute>, {
      route: "/orders",
      path: "/orders",
    });

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("renders protected customer routes for signed-in users", () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    });

    renderWithRouter(<ProtectedRoute><div>Orders Page</div></ProtectedRoute>, {
      route: "/orders",
      path: "/orders",
    });

    expect(screen.getByText("Orders Page")).toBeInTheDocument();
  });

  it("redirects non-admin users away from admin routes", () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      dashboardRole: null,
      loading: false,
    });

    renderWithRouter(<AdminRoute><div>Dashboard</div></AdminRoute>, {
      route: "/admin",
      path: "/admin",
    });

    expect(screen.getByText("Admin Login")).toBeInTheDocument();
  });

  it("renders admin routes for authorized dashboard users", () => {
    useAuthMock.mockReturnValue({
      user: { id: "admin-1" },
      dashboardRole: "admin",
      loading: false,
    });

    renderWithRouter(<AdminRoute><div>Dashboard</div></AdminRoute>, {
      route: "/admin",
      path: "/admin",
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
