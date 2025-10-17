import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/lib/ipfs';

interface TagSuggestion {
  ticker: string;
  type: 'artist' | 'song';
  name: string;
  wallet_address?: string;
  avatar_cid?: string;
  cover_cid?: string;
  verified?: boolean;
}

interface TagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TagAutocomplete({
  value,
  onChange,
  placeholder,
  className = '',
}: TagAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Find the current $ tag being typed
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = value.slice(0, cursorPos);
      const match = textBeforeCursor.match(/\$([A-Za-z0-9]*)$/);

      if (!match || match[1].length === 0) {
        setShowDropdown(false);
        setSuggestions([]);
        return;
      }

      const searchTerm = match[1].toUpperCase();
      const results: TagSuggestion[] = [];

      // Search artists
      const { data: artists } = await supabase
        .from('profiles')
        .select('artist_ticker, artist_name, wallet_address, avatar_cid, verified')
        .not('artist_ticker', 'is', null)
        .ilike('artist_ticker', `${searchTerm}%`)
        .limit(5);

      if (artists) {
        artists.forEach(artist => {
          if (artist.artist_ticker && artist.artist_name) {
            results.push({
              ticker: artist.artist_ticker,
              type: 'artist',
              name: artist.artist_name,
              wallet_address: artist.wallet_address,
              avatar_cid: artist.avatar_cid || undefined,
              verified: artist.verified || false,
            });
          }
        });
      }

      // Search songs
      const { data: songs } = await supabase
        .from('songs')
        .select('ticker, title, wallet_address, cover_cid')
        .not('ticker', 'is', null)
        .ilike('ticker', `${searchTerm}%`)
        .limit(5);

      if (songs) {
        songs.forEach(song => {
          if (song.ticker && song.title) {
            results.push({
              ticker: song.ticker,
              type: 'song',
              name: song.title,
              wallet_address: song.wallet_address,
              cover_cid: song.cover_cid || undefined,
            });
          }
        });
      }

      // Sort: artists first, then songs, alphabetically within each group
      results.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'artist' ? -1 : 1;
        }
        return a.ticker.localeCompare(b.ticker);
      });

      setSuggestions(results.slice(0, 10));
      setShowDropdown(results.length > 0);
      setSelectedIndex(0);
    };

    fetchSuggestions();
  }, [value]);

  const insertTag = (suggestion: TagSuggestion) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    
    // Find and replace the incomplete tag
    const newTextBefore = textBeforeCursor.replace(/\$[A-Za-z0-9]*$/, `$${suggestion.ticker} `);
    const newValue = newTextBefore + textAfterCursor;
    
    onChange(newValue);
    setShowDropdown(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = newTextBefore.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertTag(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {showDropdown && suggestions.length > 0 && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-card border-border shadow-lg"
        >
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.ticker}`}
                onClick={() => insertTag(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Avatar/Cover */}
                {(suggestion.avatar_cid || suggestion.cover_cid) ? (
                  <img
                    src={getIPFSGatewayUrl(suggestion.avatar_cid || suggestion.cover_cid || '')}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-semibold">
                      {suggestion.ticker[0]}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-semibold text-sm ${
                        suggestion.type === 'artist' ? 'text-neon-green' : 'text-purple-500'
                      }`}
                    >
                      ${suggestion.ticker}
                    </span>
                    {suggestion.verified && (
                      <CheckCircle className="h-3 w-3 text-neon-green flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.name}
                  </div>
                </div>

                {/* Type badge */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    suggestion.type === 'artist'
                      ? 'bg-neon-green/20 text-neon-green'
                      : 'bg-purple-500/20 text-purple-500'
                  }`}
                >
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
