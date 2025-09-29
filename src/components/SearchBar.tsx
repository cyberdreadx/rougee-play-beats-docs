import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // TODO: Implement search functionality
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full px-6 py-4">
      <div className="flex space-x-4 max-w-4xl">
        <Input
          type="text"
          placeholder="Search artists, songs, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 console-bg tech-border text-foreground placeholder:text-muted-foreground font-mono"
        />
        <Button 
          variant="neon" 
          onClick={handleSearch}
          className="px-6"
        >
          [SEARCH]
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;