import React from "react";
import { PageContent } from "./page-content";
import { PageHeader } from "./page-header";

interface PageProps {
  icon?: React.ElementType;
  title: string;
  urlBase?: string;
}

/**
 * The console page shell.
 *
 * @deprecated Console-era chrome. Still exported and still supported - the
 * cutover in Shio and Turing is not finished, and removal is its own
 * decision, not a side effect of this notice. New pages should use the
 * bento layer.
 *
 * The bento layer ships no single shell on purpose - the shell is
 * where a product is itself. Compose `BentoNavRail`, `BentoUserMenu`
 * and `BentoCommandPalette`, or use `BentoEntityShell` for an entity
 * page.
 */
export const Page: React.FC<PageProps> = ({ icon, title, urlBase }) => {
  return (
    <>
      <PageHeader icon={icon} title={title} urlBase={urlBase} />
      <PageContent />
    </>
  )
}
