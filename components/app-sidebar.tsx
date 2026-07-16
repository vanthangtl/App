"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Gem, Landmark, Layers, LayoutDashboard, Activity, Wallet, ReceiptText, PiggyBank } from "lucide-react"

// Real navigation data for the Finance App
const sidebarData = {
  teams: [
    {
      name: "Tài chính Cá nhân",
      logo: <Wallet />,
      plan: "Quản lý chi tiêu",
    },
  ],
  navMain: [
    {
      title: "Tổng quan",
      url: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: "Tài khoản",
      url: "/accounts",
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      title: "Danh mục",
      url: "/categories",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      title: "Ngân sách",
      url: "/budget",
      icon: <PiggyBank className="h-4 w-4" />,
    },
    {
      title: "Giao dịch",
      url: "/transactions",
      icon: <ReceiptText className="h-4 w-4" />,
    },
    {
      title: "Sổ vàng",
      url: "/golds",
      icon: <Gem className="h-4 w-4" />,
    },
    {
      title: "Sổ tiết kiệm",
      url: "/savings",
      icon: <Gem className="h-4 w-4" />,
    },
    {
      title: "Hoạt động",
      url: "/activity",
      icon: <Activity className="h-4 w-4" />,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  } | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const defaultUser = {
    name: "User",
    email: "user@example.com",
    avatar: ""
  }
  const activeUser = user || defaultUser

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={activeUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
