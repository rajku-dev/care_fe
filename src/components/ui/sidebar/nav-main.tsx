"use client";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ActiveLink } from "@/components/ui/sidebar/ActiveLinks";

export function NavMain({
  links,
}: {
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}) {
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
              <ActiveLink
                links={links}
                href={link.url}
                activeClass="bg-white text-green-700 shadow"
              >
                {link.icon && <CareIcon icon={link.icon as IconName} />}
                <span className="group-data-[collapsible=icon]:hidden">
                  {link.name}
                </span>
              </ActiveLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
