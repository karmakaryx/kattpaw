import React from "react";
import { S } from "../constants";
import type { RagStatus, RagSearchResult } from "../types";

interface SidebarProps {
  // File Explorer
  fileList: string[];
  fileName: string;
  onOpenTab: (name: string) => void;
  onNewFile: () => void;
  // RAG
  ragStatus: RagStatus;
  isIndexing: boolean;
  onRagIndex: () => void;
  ragSearchQuery: string;
  onRagSearchQueryChange: (q: string) => void;
  onRagSearch: () => void;
  onRagSearchClear: () => void;
  isRagSearching: boolean;
  ragSearchResults: RagSearchResult[] | null;
  onRagResultClick: (code: string, fileName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  fileList, fileName, onOpenTab, onNewFile,
  ragStatus, isIndexing, onRagIndex,
  ragSearchQuery, onRagSearchQueryChange, onRagSearch, onRagSearchClear,
  isRagSearching, ragSearchResults, onRagResultClick,
}) => {
  return (
    <aside className="w-[220px] flex flex-col shrink-0 border-r border-[#2a2a2e]" style={{ background: "#1c1c1f" }}>
    {/* Note by Karyx💫: This code is omitted to protect my intellectual property. */}
    </aside>
  );
};

export default Sidebar;
