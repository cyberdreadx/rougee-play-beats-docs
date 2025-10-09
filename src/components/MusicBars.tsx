interface MusicBarsProps {
  bars?: number;
  className?: string;
  color?: string;
}

const MusicBars = ({ bars = 5, className = "", color = "neon-green" }: MusicBarsProps) => {
  return (
    <div className={`flex items-center gap-0.5 h-4 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-0.5 bg-${color} rounded-full`}
          style={{
            animation: `musicBar 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export default MusicBars;
