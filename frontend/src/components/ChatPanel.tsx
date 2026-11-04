import React, { useRef, useEffect } from "react";
import { S } from "../constants";
import type { Message, Snapshot, SearchResponse, SearchResult } from "../types";

interface ChatPanelProps {
  // Snapshots
  snapshot: Snapshot[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearch: () => void;
  onSearchClear: () => void;
  isSearchMode: boolean;
  isSearching: boolean;
  searchResults: SearchResponse | null;
  onSearchResultClick: (id: string) => void;
  onRestore: (id: string | number) => void;
  // Messages
  messages: Message[];
  isLoading: boolean;
  // Input
  input: string;
  onInputChange: (val: string) => void;
  onChat: () => void;
  onClaw: () => void;
  onPawprint: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  snapshot, searchQuery, onSearchQueryChange, onSearch, onSearchClear,
  isSearchMode, isSearching, searchResults, onSearchResultClick, onRestore,
  messages, isLoading,
  input, onInputChange, onChat, onClaw, onPawprint,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <aside className="w-[360px] flex flex-col shrink-0 border-l border-[#2a2a2e]" style={{ background: "#1c1c1f" }}>
    {/* Note by Karyx💫: This code is omitted to protect my intellectual property. */}
    </aside>
  );
};

export default ChatPanel;
