import React, { useState, useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { UNTITLED, S } from "./constants";
import type { Message, Snapshot, SearchResponse, RagStatus, RagSearchResult } from "./types";
import { ToastContainer, ConfirmModal, toast, confirm } from "./components/UI";
import Sidebar from "./components/Sidebar";
import EditorArea from "./components/EditorArea";
import ChatPanel from "./components/ChatPanel";

const toastStyle = document.createElement("style");
toastStyle.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(toastStyle);

const App: React.FC = () => {
  // Auth
  const [isLocked, setIsLocked] = useState(true);
  const [tempKey, setTempKey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Files
  const [openFiles, setOpenFiles] = useState<string[]>([UNTITLED]);
  const [fileList, setFileList] = useState<string[]>([]);
  const [fileName, setFileName] = useState(UNTITLED);
  const [codeSnippet, setCodeSnippet] = useState("# 여기에 코드를 작성하거나 파일을 선택하세요.");
  const [isUnsaved, setIsUnsaved] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Diff
  const [originalCode, setOriginalCode] = useState("");
  const [newAICode, setNewAICode] = useState("");
  const [isDiffMode, setIsDiffMode] = useState(false);

  // RAG
  const [ragStatus, setRagStatus] = useState<RagStatus>({ total_chunks: 0, indexed_files: [] });
  const [isIndexing, setIsIndexing] = useState(false);
  const [ragSearchQuery, setRagSearchQuery] = useState("");
  const [ragSearchResults, setRagSearchResults] = useState<RagSearchResult[] | null>(null);
  const [isRagSearching, setIsRagSearching] = useState(false);

  const xtermRef = useRef<Terminal | null>(null);

  // Note by Karyx💫: This code is omitted to protect my intellectual property.

  // ────────── Main Layout ──────────
  return (
    <>
      <ToastContainer />
      <ConfirmModal />
      <div className="flex h-screen w-full overflow-hidden text-[#c8c8d0]" style={{ background: "#141416" }}>
        <Sidebar
          fileList={fileList}
          fileName={fileName}
          onOpenTab={openTab}
          onNewFile={handleNewFile}
          ragStatus={ragStatus}
          isIndexing={isIndexing}
          onRagIndex={handleRagIndex}
          ragSearchQuery={ragSearchQuery}
          onRagSearchQueryChange={(q) => { setRagSearchQuery(q); if (!q) setRagSearchResults(null); }}
          onRagSearch={handleRagSearch}
          onRagSearchClear={() => { setRagSearchQuery(""); setRagSearchResults(null); }}
          isRagSearching={isRagSearching}
          ragSearchResults={ragSearchResults}
          onRagResultClick={handleRagResultClick}
        />
        <EditorArea
          openFiles={openFiles}
          fileName={fileName}
          codeSnippet={codeSnippet}
          isUnsaved={isUnsaved}
          isLoading={isLoading}
          isDiffMode={isDiffMode}
          originalCode={originalCode}
          newAICode={newAICode}
          onLoadFile={loadFile}
          onCloseTab={closeTab}
          onCodeChange={(val) => { setCodeSnippet(val); setIsUnsaved(true); }}
          onRun={runCode}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
          xtermRef={xtermRef}
        />
        <ChatPanel
          snapshot={snapshot}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          onSearchClear={handleSearchClear}
          isSearchMode={isSearchMode}
          isSearching={isSearching}
          searchResults={searchResults}
          onSearchResultClick={handleSearchResultClick}
          onRestore={handleRestore}
          messages={messages}
          isLoading={isLoading}
          input={input}
          onInputChange={setInput}
          onChat={handleChat}
          onClaw={handleClaw}
          onPawprint={handlePawprint}
        />
      </div>
    </>
  );
};

export default App;
