import React from "react";
import { PageContent } from "./page-content";
import { PageHeader } from "./page-header";

interface PageProps {
  icon?: React.ElementType;
  title: string;
  urlBase?: string;
}

export const Page: React.FC<PageProps> = ({ icon, title, urlBase }) => {
  return (
    <>
      <PageHeader icon={icon} title={title} urlBase={urlBase} />
      <PageContent />
    </>
  )
}
