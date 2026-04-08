import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminMenuManager from "@/components/admin/AdminMenuManager";

const toastMock = vi.fn();
const selectOrderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const insertMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table !== "menu_items") {
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
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      }),
    },
  },
}));

describe("AdminMenuManager", () => {
  beforeEach(() => {
    toastMock.mockReset();
    selectOrderMock.mockClear();
    insertMock.mockReset();
  });

  it("prevents saving a dish without a name", async () => {
    render(<AdminMenuManager userRole="admin" />);

    await waitFor(() => expect(screen.getByText(/Add Item/)).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: /add item/i })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /add item/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Name is required" }));
    });

    expect(insertMock).not.toHaveBeenCalled();
  });
});
