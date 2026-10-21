import assert from "node:assert/strict";

/**
 * Conservative automated accessibility smoke checks. These deliberately do not
 * claim WCAG certification and do not replace assistive-technology reviews.
 */
export async function checkAccessibility(page, label) {
  const problems = await page.evaluate(() => {
    const issues = [];
    if (document.documentElement.lang !== "sq") issues.push("Document language must be sq");
    if (!document.title.trim()) issues.push("Document title is empty");
    if (document.querySelectorAll("main").length !== 1) issues.push("Expected one main landmark");
    if (!document.querySelector("h1")) issues.push("No primary h1 heading");

    const ids = new Set();
    for (const el of document.querySelectorAll("[id]")) {
      if (ids.has(el.id)) issues.push("Duplicate id: " + el.id);
      ids.add(el.id);
    }
    const visible = el => !!(el.getClientRects().length) && getComputedStyle(el).visibility !== "hidden";
    const labelText = el => {
      const aria = el.getAttribute("aria-label");
      const describedBy = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean)
        .map(id => document.getElementById(id)?.textContent || "").join(" ");
      const normal = [...(el.labels || [])].map(x => x.textContent || "").join(" ");
      return [aria, describedBy, normal].join(" ").trim();
    };
    for (const el of document.querySelectorAll("input:not([type=hidden]), select, textarea")) {
      if (visible(el) && !labelText(el)) issues.push("Unlabeled input: " + (el.name || el.outerHTML.slice(0, 90)));
    }
    for (const el of document.querySelectorAll("button, a[href]")) {
      if (!visible(el)) continue;
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim();
      if (!name) issues.push("Unnamed control: " + el.outerHTML.slice(0, 90));
    }
    for (const img of document.querySelectorAll("img")) {
      if (!img.hasAttribute("alt")) issues.push("Image has no alt attribute");
    }
    for (const dialog of document.querySelectorAll("dialog[open]")) {
      if (!dialog.hasAttribute("aria-label") && !dialog.hasAttribute("aria-labelledby")) {
        issues.push("Open dialog has no accessible name");
      }
    }
    return issues;
  });
  assert.deepEqual(problems, [], label + " accessibility smoke failures: " + problems.join("; "));
}
