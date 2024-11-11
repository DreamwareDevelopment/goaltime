import { User } from "@goaltime/shared/models";
import {
  Navbar as NextUINavbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Avatar,
  Button
} from "@nextui-org/react";

import ThemeSwitch from "../components/theme-switcher";
import { BasketballIcon } from "./icons";

export type NavibarProps = {
  user?: User;
}

export default function Navbar({ user }: NavibarProps) {
  const menuItems = {
    Home: "/",
    Settings: "/settings",
    Logout: "/logout"
  };
  const avatarName = user?.avatarUrl || user?.username;
  return (
    <NextUINavbar className="py-2 px-0" isBordered shouldHideOnScroll>
      <NavbarBrand className="hidden md:flex gap-2">
        <BasketballIcon size={44} />
        <p className="font-bold text-warning text-inherit">goaltime</p>
      </NavbarBrand>
      <NavbarMenuToggle className="md:hidden" />
      <NavbarContent className="hidden md:flex" justify="center">
        <Link color="foreground" href="/">
          Home
        </Link>
      </NavbarContent>
      <NavbarBrand className="md:hidden justify-center">
        <BasketballIcon size={44} />
      </NavbarBrand>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch className="pt-1" />
        </NavbarItem>
        <NavbarItem>
          {avatarName ? <Avatar name={avatarName} /> : <Button as={Link} color="warning" href="/login">Login</Button>}
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {Object.entries(menuItems).map(([key, value], index) => (
          <NavbarMenuItem key={`${key}-${index}`}>
            <Link
              color={
                index === 2 ? "primary" : index === Object.keys(menuItems).length - 1 ? "danger" : "foreground"
              }
              className="w-full"
              href={value}
              size="lg"
            >
              {key}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </NextUINavbar>
  );
}
