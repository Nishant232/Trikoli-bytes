import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminCouponManager from "@/components/admin/AdminCouponManager";

const toastMock = vi.fn();
const selectOrderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const insertMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table !== "coupons") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: () => ({
          order: selectOrderMock,
        }),
        insert: insertMock,
        update: vi.fn(),
        delete: vi.fn(),
      };
    },
  },
}));

describe("AdminCouponManager", () => {
  beforeEach(() => {
    toastMock.mockReset();
    selectOrderMock.mockClear();
    insertMock.mockReset();
  });

  it("prevents creating an already expired coupon", async () => {
    render(<AdminCouponManager userRole="admin" />);

    await waitFor(() => expect(screen.getByText(/Create Coupon/)).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: /create coupon/i })[0]);

    const dialog = await screen.findByRole("dialog");

    fireEvent.change(screen.getByPlaceholderText("SAVE20"), {
      target: { value: "OLD10" },
    });
    fireEvent.change(screen.getByPlaceholderText("20"), {
      target: { value: "20" },
    });
    const dateFieldWrapper = within(dialog).getByText("Expires At").parentElement;
    const dateInput = dateFieldWrapper?.querySelector("input");
    expect(dateInput).not.toBeNull();
    fireEvent.change(dateInput!, {
      target: { value: "2000-01-01" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /create coupon/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Invalid coupon details" }),
      );
    });
    expect(insertMock).not.toHaveBeenCalled();
  });
});
