import { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";

export const renderWithRouter = (
  ui: ReactNode,
  {
    route = "/",
    path = "/",
  }: {
    route?: string;
    path?: string;
  } = {},
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<>{ui}</>} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/admin/login" element={<div>Admin Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
