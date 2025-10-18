import { ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <Navigation />
      <div className="pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
};

export default Layout;

