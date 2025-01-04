"use client";

import { useState } from "react";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/ui/sidebar/NavLink";

export function NavMain({
  links,
}: {
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}) {
  const [activeLink, setActiveLink] = useState<string | null>("Facility");

  const handleSetActive = (name: string) => {
    console.log(name);
    setActiveLink(name);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.name}>
            <SidebarMenuButton
              asChild
              tooltip={link.name}
              className={
                "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
              }
            >
              <NavLink
                href={link.url}
                className="default-link-styles"
                activeClass="bg-white text-green-700 shadow"
                activeLink={activeLink}
                setActive={handleSetActive}
                name={link.name}
              >
                {link.icon && <CareIcon icon={link.icon as IconName} />}
                <span className="group-data-[collapsible=icon]:hidden">
                  {link.name}
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
