"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationLink
              href={link.href}
              label={link.label}
              pathname={pathname}
            />
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function NavigationLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href;
  const [isTapping, setIsTapping] = useState(false);

  const handleClick = () => {
    setIsTapping(true);
    // ページ遷移が完了したら状態をリセット
    setTimeout(() => setIsTapping(false), 300);
  };

  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          isActive && "font-bold",
          !isActive && "text-muted-foreground",
          "transition-all duration-150",
          isTapping && "bg-accent/80 opacity-80 scale-95",
        )}
      >
        {label}
      </Link>
    </NavigationMenuLink>
  );
}
