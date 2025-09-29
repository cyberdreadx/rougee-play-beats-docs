const TrendingArtists = () => {
  return (
    <section className="w-full px-6 py-6">
      <h2 className="text-xl font-bold font-mono mb-4 neon-text">
        TRENDING ARTISTS
      </h2>
      
      <div className="console-bg tech-border rounded p-6">
        <div className="text-center">
          <h3 className="text-lg font-mono text-muted-foreground mb-2">
            NO ARTISTS YET
          </h3>
          <p className="text-sm font-mono text-muted-foreground italic">
            Be the first to launch music!
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrendingArtists;