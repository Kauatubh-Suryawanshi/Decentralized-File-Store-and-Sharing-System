import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the DecentraShare application", () => {
  delete window.ethereum;
  render(<App />);

  expect(screen.getByRole("heading", { name: /Decentralized File Store & Sharing/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Connect MetaMask/i })).toBeInTheDocument();
  expect(screen.getByText(/Account: Not connected/i)).toBeInTheDocument();
});
