import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
} from "../Modal";
import { Button } from "../Button";

describe("Modal", () => {
  it("renders modal content when open is true", () => {
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(ModalContent, {}, "Modal content"),
      ),
    );
    expect(screen.getByText("Modal content")).toBeTruthy();
  });

  it("does not render modal content when open is false", () => {
    render(
      React.createElement(
        Modal,
        { open: false },
        React.createElement(ModalContent, {}, "Hidden content"),
      ),
    );
    expect(screen.queryByText("Hidden content")).toBeNull();
  });

  it("renders title, body, and footer components together", () => {
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(
          ModalContent,
          {},
          React.createElement(
            ModalHeader,
            {},
            React.createElement(ModalTitle, {}, "Title"),
            React.createElement(ModalDescription, {}, "Description"),
          ),
          React.createElement(ModalBody, {}, "Body"),
          React.createElement(ModalFooter, {}, "Footer"),
        ),
      ),
    );
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("supports ARIA describedby for accessibility", () => {
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(
          ModalContent,
          { "aria-describedby": "desc-id" },
          React.createElement(ModalDescription, { id: "desc-id" }, "Description"),
        ),
      ),
    );
    expect(screen.getByText("Description")?.id).toBe("desc-id");
  });

  it("supports custom role on ModalContent", () => {
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(ModalContent, { role: "alertdialog" }, "Alert"),
      ),
    );
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });

  it("ModalTrigger opens modal when clicked", () => {
    render(
      React.createElement(
        Modal,
        {},
        React.createElement(
          ModalTrigger,
          { asChild: true },
          React.createElement(Button, { "data-testid": "trigger" }, "Open"),
        ),
        React.createElement(ModalContent, {}, "Content"),
      ),
    );
    expect(screen.queryByText("Content")).toBeNull();
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("ModalClose button renders when provided", () => {
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(
          ModalContent,
          {},
          React.createElement(ModalClose, { "data-testid": "close-btn" }, "Close"),
        ),
      ),
    );
    expect(screen.getByTestId("close-btn")).toBeTruthy();
  });

  it("forwards ref to ModalContent", () => {
    let ref: HTMLDivElement | null = null;
    render(
      React.createElement(
        Modal,
        { open: true },
        React.createElement(ModalContent, { ref: (el) => (ref = el) }, "X"),
      ),
    );
    expect(ref).toBeTruthy();
  });
});
