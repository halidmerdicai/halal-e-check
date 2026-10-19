import { expect, type Page } from "@playwright/test";

export function monitorResources(page: Page) {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") failures.push(`${request.failure()?.errorText} ${request.url()}`);
  });
  page.on("pageerror", (error) => failures.push(error.message));
  return () => expect(failures, "All page resources and client execution must succeed").toEqual([]);
}
