import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Checkout from "@/pages/Checkout";

const {
  navigateMock,
  toastMock,
  clearCartMock,
  useAuthMock,
  useCartMock,
  profilesMaybeSingleMock,
  couponsSingleMock,
  profilesUpsertMock,
  placeOrderRpcMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastMock: vi.fn(),
  clearCartMock: vi.fn(),
  useAuthMock: vi.fn(),
  useCartMock: vi.fn(),
  profilesMaybeSingleMock: vi.fn(),
  couponsSingleMock: vi.fn(),
  profilesUpsertMock: vi.fn(),
  placeOrderRpcMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => useCartMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: profilesMaybeSingleMock,
            }),
          }),
          upsert: profilesUpsertMock,
        };
      }

      if (table === "coupons") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: couponsSingleMock,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
    rpc: placeOrderRpcMock,
  },
}));

describe("Checkout", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    toastMock.mockReset();
    clearCartMock.mockReset();
    profilesMaybeSingleMock.mockReset();
    couponsSingleMock.mockReset();
    profilesUpsertMock.mockReset();
    placeOrderRpcMock.mockReset();

    profilesMaybeSingleMock.mockResolvedValue({ data: { address: "", phone: "" } });
    profilesUpsertMock.mockResolvedValue({ error: null });

    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
    });

    useCartMock.mockReturnValue({
      items: [{ id: "dish-1", name: "Paneer", price: 200, quantity: 2, image: "/dish.jpg" }],
      totalPrice: 400,
      clearCart: clearCartMock,
    });
  });

  it("applies a valid coupon and places an order", async () => {
    couponsSingleMock.mockResolvedValue({
      data: {
        code: "WELCOME10",
        discount_percent: 10,
        min_order_amount: 200,
        max_uses: 10,
        used_count: 2,
        expires_at: "2099-12-31T00:00:00.000Z",
      },
      error: null,
    });
    placeOrderRpcMock.mockResolvedValue({ data: "order-1", error: null });

    render(<Checkout />);

    const addressInput = await screen.findByPlaceholderText("Enter your full address");
    fireEvent.change(addressInput, {
      target: { value: "Main Street" },
    });
    fireEvent.change(screen.getByPlaceholderText("10-digit mobile number"), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter coupon code"), {
      target: { value: "WELCOME10" },
    });

    fireEvent.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "10% off applied" }),
      );
    });

    fireEvent.click(screen.getByText(/Place Order -/));

    await waitFor(() => {
      expect(placeOrderRpcMock).toHaveBeenCalledWith("place_order", expect.objectContaining({
        p_coupon_code: "WELCOME10",
        p_delivery_address: "Main Street",
        p_phone: "9876543210",
      }));
    });

    expect(clearCartMock).toHaveBeenCalled();
    expect(screen.getByText("Order Confirmed!")).toBeInTheDocument();
  });

  it("blocks expired coupons before order placement", async () => {
    couponsSingleMock.mockResolvedValue({
      data: {
        code: "OLD10",
        discount_percent: 10,
        min_order_amount: 0,
        max_uses: null,
        used_count: 0,
        expires_at: "2000-01-01T00:00:00.000Z",
      },
      error: null,
    });

    render(<Checkout />);

    fireEvent.change(screen.getByPlaceholderText("Enter coupon code"), {
      target: { value: "OLD10" },
    });
    fireEvent.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Coupon expired" }));
    });
  });
});
