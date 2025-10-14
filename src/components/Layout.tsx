import { ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      {children}
    </div>
  );
};

export default Layout;

