import { User } from "@goaltime/shared/models";

export type NavibarProps = {
  user?: User;
}

export default function Navbar({ user }: NavibarProps) {
  // const menuItems = {
  //   Home: "/",
  //   Settings: "/settings",
  //   Logout: "/logout"
  // };
  // const avatarName = user?.avatarUrl || user?.username;
  return (
    <div className="w-full flex justify-end p-4">
    </div>
  );
}
