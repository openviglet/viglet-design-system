import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BentoPanel } from "./index";

/*
 * The gap this closes is not "there was no panel" — it is that four surfaces in a consumer asked
 * for one, got a component that silently declined, and nothing noticed. `AdaptiveSectionCard`
 * re-skins only where it finds a header child, so a panel written with no heading fell through to
 * the console card *under the bento shell*, and neither review, nor `tsc`, nor a census saw it.
 * What found it was a browser probe reading `backdrop-filter` off computed style.
 *
 * So the assertion that matters here is that the frosted class is actually on the element. A test
 * that only checked the children render would have passed against the very component that caused
 * the defect.
 */
describe("BentoPanel", () => {
  it("frosts the container, which is the whole reason it exists", () => {
    render(<BentoPanel>content</BentoPanel>);

    const panel = screen.getByText("content").parentElement;
    expect(panel?.className).toContain("bento-glass");
    expect(panel?.className).toContain("rounded-2xl");
  });

  it("renders no heading and no header element", () => {
    render(<BentoPanel>a stats strip</BentoPanel>);

    // The absence is the feature. A stats strip, a toolbar and a listing all sit under a hero that
    // already names the page, and an empty heading here would put a section in the document
    // outline that the page does not have.
    expect(screen.queryByRole("heading")).toBeNull();
    expect(document.querySelector("header")).toBeNull();
  });

  it("carries no padding of its own, so a table can reach the edge", () => {
    render(<BentoPanel contentClassName="p-0">rows</BentoPanel>);

    const content = screen.getByText("rows");
    expect(content.className).toBe("p-0");
  });

  it("keeps the container and the content classes apart", () => {
    // Two slots rather than one, because `overflow-hidden` belongs on the rounded container and
    // the inset belongs inside it. Merging them puts the padding where the radius is and clips
    // nothing.
    render(
      <BentoPanel className="mb-4 overflow-hidden" contentClassName="px-6 py-3">
        toolbar
      </BentoPanel>,
    );

    const content = screen.getByText("toolbar");
    expect(content.className).toBe("px-6 py-3");
    expect(content.parentElement?.className).toContain("overflow-hidden");
    expect(content.parentElement?.className).not.toContain("px-6");
  });
});
