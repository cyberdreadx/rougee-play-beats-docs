import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaggedTextProps {
  text: string;
  className?: string;
}

interface TagInfo {
  ticker: string;
  type: 'artist' | 'song';
  artistWallet?: string;
  songId?: string;
}

export default function TaggedText({ text, className = '' }: TaggedTextProps) {
  const navigate = useNavigate();
  const [tagMap, setTagMap] = useState<Map<string, TagInfo>>(new Map());

  useEffect(() => {
    const fetchTagInfo = async () => {
      // Extract all $TICKER patterns from text
      const tickerPattern = /\$([A-Za-z0-9]+)/g;
      const matches = [...text.matchAll(tickerPattern)];
      const tickers = [...new Set(matches.map(m => m[1].toUpperCase()))];

      if (tickers.length === 0) return;

      const newTagMap = new Map<string, TagInfo>();

      // Check for artist tickers
      const { data: artistData } = await supabase
        .from('profiles')
        .select('artist_ticker, wallet_address')
        .in('artist_ticker', tickers)
        .not('artist_ticker', 'is', null);

      artistData?.forEach(artist => {
        if (artist.artist_ticker) {
          newTagMap.set(artist.artist_ticker.toUpperCase(), {
            ticker: artist.artist_ticker,
            type: 'artist',
            artistWallet: artist.wallet_address,
          });
        }
      });

      // Check for song tickers (only check tickers not already matched to artists)
      const remainingTickers = tickers.filter(t => !newTagMap.has(t));
      if (remainingTickers.length > 0) {
        const { data: songData } = await supabase
          .from('songs')
          .select('ticker, id, wallet_address')
          .in('ticker', remainingTickers)
          .not('ticker', 'is', null);

        songData?.forEach(song => {
          if (song.ticker && !newTagMap.has(song.ticker.toUpperCase())) {
            newTagMap.set(song.ticker.toUpperCase(), {
              ticker: song.ticker,
              type: 'song',
              songId: song.id,
              artistWallet: song.wallet_address,
            });
          }
        });
      }

      setTagMap(newTagMap);
    };

    fetchTagInfo();
  }, [text]);

  const handleTagClick = (tagInfo: TagInfo, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tagInfo.type === 'artist' && tagInfo.artistWallet) {
      navigate(`/artist/${tagInfo.artistWallet}`);
    } else if (tagInfo.type === 'song' && tagInfo.songId) {
      navigate(`/song/${tagInfo.songId}`);
    }
  };

  const renderText = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const tickerPattern = /\$([A-Za-z0-9]+)/g;
    let match;

    while ((match = tickerPattern.exec(text)) !== null) {
      const ticker = match[1].toUpperCase();
      const tagInfo = tagMap.get(ticker);

      // Add text before the tag
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the tag (clickable or plain)
      if (tagInfo) {
        const colorClass = tagInfo.type === 'artist' ? 'text-neon-green' : 'text-purple-500';
        parts.push(
          <span
            key={match.index}
            className={`${colorClass} hover:underline cursor-pointer font-semibold transition-colors`}
            onClick={(e) => handleTagClick(tagInfo, e)}
          >
            ${tagInfo.ticker}
          </span>
        );
      } else {
        // Keep non-matching tags as plain text
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return <span className={className}>{renderText()}</span>;
}
