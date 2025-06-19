
import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

type MainLayoutProps = {
  children: ReactNode;
  hideNavbar?: boolean;
};

const MainLayout = ({ children, hideNavbar = false }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default MainLayout;
