import React from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import LiveStream from "@/components/LiveStream";
import TrendingArtists from "@/components/TrendingArtists";
import TopSongs from "@/components/TopSongs";

const Index = () => {
  const [activeTab, setActiveTab] = React.useState("DISCOVER");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchBar />
      <LiveStream />
      <TrendingArtists />
      <TopSongs />
    </div>
  );
};

export default Index;
