"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

import { NAV_ITEMS } from "../config/nav-items";

// Every menu entry, parents before their sub-items, so crumbs come out in URL order.
const NAV_ENTRIES = NAV_ITEMS.flatMap((item) => [item, ...(item.items ?? [])]);

export const AppHeader = () => {
  // Typed nullable because of the root `pages/` folder (Pages Router); never null in the App Router.
  const pathname = usePathname() ?? "/";
  // The entries for this URL and the URLs above it: "/" → 홈.
  const crumbs = NAV_ENTRIES.filter(
    ({ to }) => to === pathname || (to !== "/" && pathname.startsWith(`${to}/`)),
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-center"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.to}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index < crumbs.length - 1 ? (
                  <BreadcrumbLink render={<Link href={crumb.to} />}>{crumb.title}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};
