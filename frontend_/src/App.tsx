import React, { useState, useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { authManager } from "./utils/auth";
import axios from "./utils/config";
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

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authManager.isLoggedIn()) setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!isLocked) { fetchFiles(); fetchRagStatus(); }
  }, [isLocked]);

  useEffect(() => {
    if (!isLocked && fileName) fetchSnapshots(fileName);
  }, [fileName, isLocked]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fileName !== UNTITLED) syncContext(fileName, codeSnippet);
    }, 1000);
    return () => clearTimeout(timer);
  }, [codeSnippet, fileName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName, codeSnippet]);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (!tempKey.trim()) { toast.error("키를 입력하라냥!"); return; }
    setIsVerifying(true);
    try {
      await axios.post("/verify-key", { apiKey: tempKey });
      authManager.saveKey(tempKey);
      setIsLocked(false);
    } catch {
      toast.error("캬악! 유효하지 않은 열쇠다냥!");
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── File Management ───────────────────────────────────────────────────────
  const syncContext = async (targetFile: string, code: string) => {
    try {
      await axios.post("/agent/set_context", { file_name: targetFile, code_snippet: code });
    } catch { /* silent */ }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get("/files");
      setFileList(res.data.files);
    } catch { /* silent */ }
  };

  const fetchSnapshots = async (name: string) => {
    if (!name || name === UNTITLED) { setSnapshot([]); return; }
    try {
      const res = await axios.get(`/snapshots?file_name=${name}`);
      setSnapshot(res.data.map((s: { id: string; chat_summary: string }) => ({
        id: s.id,
        chatSummary: s.chat_summary,
      })));
    } catch { /* silent */ }
  };

  const fetchRagStatus = async () => {
    try {
      const res = await axios.get("/rag/status");
      if (res.data.status === "ok")
        setRagStatus({ total_chunks: res.data.total_chunks, indexed_files: res.data.indexed_files });
    } catch { /* silent */ }
  };

  const loadFile = async (name: string) => {
    if (name === UNTITLED) {
      setFileName(UNTITLED);
      setCodeSnippet("# 여기에 코드를 작성하거나 파일을 선택하세요.");
      setIsUnsaved(false);
      setIsDiffMode(false);
      setMessages([]);
      setSnapshot([]);
      return;
    }
    try {
      const res = await axios.get(`/files/${name}`);
      setFileName(name);
      setCodeSnippet(res.data.code_snippet);
      setIsUnsaved(false);
      setIsDiffMode(false);
      setMessages([]);
      setSnapshot([]);
      setOpenFiles((p) => (p.includes(name) ? p : p.map((f) => (f === UNTITLED ? name : f))));
      await fetchSnapshots(name);
    } catch { toast.error("파일 로드 실패!"); }
  };

  const openTab = async (name: string) => {
    if (!openFiles.includes(name)) setOpenFiles((p) => [...p, name]);
    await loadFile(name);
  };

  const closeTab = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const updated = openFiles.filter((f) => f !== name);
    setOpenFiles(updated);
    if (fileName === name && updated.length > 0)
      loadFile(updated[updated.length - 1]);
    else if (updated.length === 0) {
      setFileName(UNTITLED);
      setCodeSnippet("# 새 파일을 선택하거나 생성해라냥.");
      setIsUnsaved(false);
    }
  };

  const handleNewFile = async () => {
    const newName = window.prompt("🐾 새 파일 이름을 입력하라냥!", "new_file.py");
    if (!newName) return;
    try {
      await axios.post("/files/create", { file_name: newName });
      await fetchFiles();
      await openTab(newName);
    } catch { toast.error("파일 생성 실패!"); }
  };

  const handleSaveFile = async (): Promise<string | null> => {
    let currentName = fileName;
    if (fileName === UNTITLED) {
      const newName = prompt("저장할 파일 이름을 입력하세요 (예: test.py):", "test.py");
      if (!newName) return null;
      try {
        await axios.post("/files/create", { file_name: newName });
        setFileName(newName);
        setOpenFiles((p) => p.map((f) => (f === UNTITLED ? newName : f)));
        currentName = newName;
      } catch { toast.error("파일 생성 실패!"); return null; }
    }
    try {
      await axios.post(`/files/${currentName}`, { code_snippet: codeSnippet });
      setIsUnsaved(false);
      await fetchFiles();
      return currentName;
    } catch { toast.error("저장 실패!"); return null; }
  };

  // ─── RAG ───────────────────────────────────────────────────────────────────
  const handleRagIndex = async () => {
    if (isIndexing) return;
    setIsIndexing(true);
    xtermRef.current?.writeln("\x1b[38;2;0;255;0m🧠 [RAG] 코드 인덱싱 시작...\x1b[0m");
    try {
      const res = await axios.post("/rag/index");
      const { files_indexed, chunks_created, file_list } = res.data;
      xtermRef.current?.writeln(`\x1b[38;2;0;255;0m✅ [RAG] 인덱싱 완료! 파일 ${files_indexed}개, 청크 ${chunks_created}개\x1b[0m`);
      setRagStatus({ total_chunks: chunks_created, indexed_files: file_list });
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "알 수 없는 오류";
      xtermRef.current?.writeln(`\x1b[31m❌ [RAG] 인덱싱 실패: ${detail}\x1b[0m`);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleRagSearch = async () => {
    if (!ragSearchQuery.trim() || isRagSearching) return;
    if (ragStatus.total_chunks === 0) { toast.error("먼저 코드 인덱싱을 해라냥!"); return; }
    setIsRagSearching(true);
    try {
      const res = await axios.post("/rag/search", { query: ragSearchQuery, n_results: 5 });
      setRagSearchResults(res.data.results ?? []);
    } catch {
      toast.error("코드 검색 실패!");
      setRagSearchResults([]);
    } finally {
      setIsRagSearching(false);
    }
  };

  const handleRagResultClick = (code: string, file: string) => {
    // 파일이 fileList에 있으면 에디터에서 열기, 없으면 toast만
    if (fileList.includes(file)) {
      openTab(file);
      toast.info(`${file} 파일을 열었다냥! 🐾`);
    } else {
      toast.info(`${file} 파일을 찾을 수 없다냥. Explorer에서 확인해봐라냥!`);
    }
    // 사용하지 않는 code 파라미터 방어 (타입 유지)
    void code;
  };

  // ─── Chat ──────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setIsSearchMode(true);
    try {
      const res = await axios.post("/search/snapshots", { query: searchQuery, file_name: fileName });
      setSearchResults(res.data);
    } catch {
      setSearchResults({ summary: "검색 중 오류가 발생했다냥... 😿", results: [], generated_sql: "", error: "서버 연결 실패" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = async (snapId: string) => {
    setIsSearchMode(false);
    setSearchQuery("");
    setSearchResults(null);
    await handleRestore(snapId);
  };

  const handleSearchClear = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleChat = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    const userMsg: Message = { role: "user", content: input };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    try {
      const cleanHistory = messages.map(({ role, content }) => ({ role, content }));
      const res = await axios.post("/chat", {
        message: input, history: cleanHistory,
        file_name: fileName, code_snippet: codeSnippet, intent: "CONSULT",
      });
      setMessages((p) => [...p, {
        role: "assistant",
        content: res.data.reply,
        usage: { ...res.data.usage, rag_used: res.data.rag_used ?? res.data.usage?.rag_used ?? false },
      }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "서버 연결에 실패했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaw = async () => {
    if (isLoading) return;
    const command = input.trim() || "현재 코드를 최적화해줘.";
    setIsLoading(true);
    setMessages((p) => [...p, { role: "user", content: `[CLAW] ${command}` }]);
    setInput("");
    try {
      const cleanHistory = messages.map(({ role, content }) => ({ role, content }));
      const res = await axios.post("/chat", {
        message: command, history: cleanHistory,
        file_name: fileName, code_snippet: codeSnippet, intent: "CLAW",
      });
      const match = res.data.reply.match(/```python\n([\s\S]*?)```/);
      if (match) {
        setOriginalCode(codeSnippet);
        setNewAICode(match[1].trim());
        setIsDiffMode(true);
        setMessages((p) => [...p, { role: "assistant", content: "🐾 코드를 수정했습니다. Diff를 확인해 주세요." }]);
      } else {
        setMessages((p) => [...p, { role: "assistant", content: res.data.reply }]);
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "수정 요청 실패!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runCode = async () => {
    if (!codeSnippet) return;
    const confirmedName = await handleSaveFile();
    if (!confirmedName) return;
    setIsLoading(true);
    xtermRef.current?.writeln(`\x1b[38;2;0;255;0m$ python ${confirmedName}\x1b[0m`);
    try {
      const res = await axios.post("/run", { code_snippet: codeSnippet, file_name: confirmedName });
      xtermRef.current?.writeln(res.data.output);
      const errorKeywords = ["Error", "Traceback", "Exception", "Fail"];
      if (res.data.has_error || errorKeywords.some((kw) => (res.data.output || "").includes(kw))) {
        xtermRef.current?.writeln("\x1b[31m[SYSTEM] 에러 감지! KattPaw가 분석 준비를 마쳤습니다.🐾\x1b[0m");
        setMessages((p) => [...p, { role: "assistant", content: "집사야! 에러가 났다냥! 내가 고쳐줄까? 🐾\n(CLAW 버튼을 누르거나 '고쳐줘'라고 말해봐!)" }]);
        setInput(`이 에러 좀 고쳐줘: ${(res.data.output || "").slice(0, 500)}`);
      } else {
        xtermRef.current?.writeln("\x1b[38;2;0;255;0m[SYSTEM] 실행 완료! 클린하다냥! ✨\x1b[0m");
      }
    } catch {
      xtermRef.current?.writeln("\r\n\x1b[31m실행 중 오류가 발생했습니다.\x1b[0m");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePawprint = async () => {
    let currentName = fileName;
    if (!fileName || fileName === UNTITLED) {
      const confirmed = await handleSaveFile();
      if (!confirmed) return;
      currentName = confirmed;
    }
    try {
      const res = await axios.post("/snapshot", {
        file_name: currentName, code_snippet: codeSnippet,
        messages: messages.map(({ role, content }) => ({ role, content })),
      });
      if (res.data.id) {
        toast.success("새로운 깟뽀가 생성되었다냥! 🐾");
        setMessages([]);
        await fetchSnapshots(currentName);
      }
    } catch { toast.error("깟뽀 생성 실패... 🐾"); }
  };

  const handleAccept = () => { setCodeSnippet(newAICode); setIsUnsaved(true); setIsDiffMode(false); };
  const handleDiscard = () => setIsDiffMode(false);

  const handleRestore = async (snapId: string | number) => {
    const ok = await confirm({
      message: "🐾 이 시점으로 타임슬립 할까요?",
      description: "현재 코드가 덮어씌워집니다. 저장되지 않은 변경사항은 사라집니다.",
      confirmLabel: "타임슬립!", cancelLabel: "취소", danger: true,
    });
    if (!ok) return;
    try {
      const res = await axios.get(`/snapshot/${snapId}`);
      setCodeSnippet(res.data.code_snippet);
      const rawHistory = res.data.chat_history;
      const restoredMessages: Message[] = Array.isArray(rawHistory)
        ? (rawHistory as any[])
            .filter((m: any): m is { role: string; content: string } =>
              typeof m === "object" && m !== null && "role" in m && "content" in m)
            .map((m: { role: string; content: string }) => ({
              role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
              content: String(m.content),
            }))
        : [];
      setMessages(restoredMessages);
      if (res.data.file_name) setFileName(res.data.file_name);
      setIsDiffMode(false);
      setIsUnsaved(true);
      xtermRef.current?.writeln(`\x1b[38;2;0;255;0m[SYSTEM] 스냅샷 ${snapId} 복구 완료!\x1b[0m`);
      toast.success("타임슬립 완료! 코드가 복구되었다냥 🐾");
    } catch { toast.error("타임슬립 실패!"); }
  };

  // ─── Lock Screen ───────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <>
        <ToastContainer />
        <ConfirmModal />
        <div className="flex flex-col items-center justify-center h-screen bg-[#0e0e10] text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f5bccb]/[0.04] blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-[#43304a]/[0.15] blur-[80px]" />
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#f5bccb 1px, transparent 1px), linear-gradient(90deg, #f5bccb 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          <div className="relative z-10 flex flex-col items-center gap-6 w-80">
            <div className="flex flex-col items-center gap-2">
              <span className="text-7xl leading-none select-none">🍞🐈</span>
              <h1 className="text-3xl font-bold tracking-[0.15em]" style={{ color: "#f5bccb" }}>KattPaw</h1>
              <p className="text-[11px] tracking-[0.2em] text-[#4a4a52]">Cybernetic Calico IDE</p>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#f5bccb]/30 to-transparent" />
            <div className="w-full flex flex-col gap-3">
              <input
                type="password"
                placeholder="OpenAI API Key  (sk-...)"
                className={S.input + " text-center tracking-widest h-12 text-[14px]"}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                autoFocus
              />
              <button
                onClick={handleUnlock}
                disabled={isVerifying}
                className="h-12 w-full rounded-md bg-[#f5bccb] text-[#141416] text-[14px] font-bold tracking-[0.1em] hover:bg-white transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "확인 중..." : "🗝  간식상자 열기"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Main Layout ───────────────────────────────────────────────────────────
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
