import { HouseIcon, type LucideIcon } from "lucide-react";
import type { Route } from "next";

interface NavSubItem {
  title: string;
  to: Route;
}

interface NavItem {
  title: string;
  to: Route;
  icon: LucideIcon;
  items?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [{ title: "홈", to: "/", icon: HouseIcon }];
