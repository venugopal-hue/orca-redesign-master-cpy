"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Paperclip, 
  Mic, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  X, 
  FileText, 
  Loader2,
  Printer,
  Plus,
  Search,
  Trash2,
  Edit2,
  Pin,
  Volume2,
  VolumeX,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  Grid,
  History,
  AlertTriangle,
  FolderOpen,
  MoreHorizontal
} from "lucide-react";
import { Letterhead } from "./Letterhead";
import { aiReportDatabase, AIPresetBrief } from "@/lib/mock";
import { useAuth } from "@/context/AuthContext";
import { useIntelligence } from "@/context/IntelligenceContext";
import { AttachmentFile, ChatMessage, ChatConversation } from "@/lib/chatService";

const getHumanReadableTab = (tab: string) => {
  switch (tab) {
    case "dashboard": return "Dashboard";
    case "analytics": return "Analytics";
    case "fir": return "FIR Vault";
    case "heatmap": return "Heatmap";
    case "networks": return "Criminal Networks";
    case "copilot": return "Copilot";
    case "reports": return "Reports";
    case "verification-document": return "Verification";
    case "settings": return "Settings";
    default: return tab;
  }
};

const detectTextLanguage = (text: string): string => {
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return "kn-IN";
  }
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi-IN";
  }
  return "en-US";
};

export const AIChatbotModule: React.FC = () => {
  const { officerProfile } = useAuth();
  const {
    conversations,
    activeConvId,
    setActiveConvId,
    createConversation,
    addMessageToActiveConv,
    deleteConv,
    renameConv,
    pinConv,
    isGeneratingChat,
    setIsGeneratingChat
  } = useIntelligence();

  // Sidebar Layout States (remember state in localStorage)
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orca_chatbot_sidebar_expanded");
      if (saved !== null) return saved === "true";
      return window.innerWidth > 1024; // default expanded on desktop
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("orca_chatbot_sidebar_expanded", String(sidebarExpanded));
  }, [sidebarExpanded]);

  // Sidebar search & inline edit states
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    if (activeMenuId) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [activeMenuId]);

  // Input states
  const [inputText, setInputText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentFile[]>([]);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const emptyFileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;
  const messages = activeConv ? activeConv.messages : [];

  // Scroll to bottom on updates
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 100);
    const t2 = setTimeout(scrollToBottom, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, isGeneratingChat]);

  // Load and cache voices for Web Speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  // Handle suggestion prompt click
  const handleSuggestionClick = (promptText: string) => {
    setInputText(promptText);
  };

  // Handle File Upload Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type || "document"
      }));
      setPendingAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Browser Speech-to-Text Recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(prev => prev + (prev ? " " : "") + speechToText);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        console.warn("Speech recognition: no speech detected (silent timeout).");
      } else {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const toggleMicrophone = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      startListening();
    }
  };

  // Browser Text-to-Speech Narration
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-⚠️]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Dynamically detect language from the actual text block characters
    const detectedLang = detectTextLanguage(cleanText);
    utterance.lang = detectedLang;
    
    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang.toLowerCase() === detectedLang.toLowerCase().replace("_", "-"));
    if (!voice) {
      const langPrefix = detectedLang.split("-")[0].toLowerCase();
      voice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    }
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleToggleTts = () => {
    const nextVal = !ttsEnabled;
    setTtsEnabled(nextVal);
    if (nextVal) {
      const lastOrcaMsg = [...messages].reverse().find(m => m.sender === "orca");
      if (lastOrcaMsg) {
        speakText(lastOrcaMsg.text);
      }
    } else {
      stopSpeaking();
    }
  };

  // Core Message Submission Logic
  const submitMessage = async (promptText: string, attachments: AttachmentFile[] = [], targetConvIdParam?: string) => {
    if (!promptText.trim() && attachments.length === 0) return;

    const cleanPrompt = promptText.trim();
    
    // Add user message to sync context
    const targetConvId = await addMessageToActiveConv(cleanPrompt, attachments, undefined, "user", targetConvIdParam);
    
    setIsGeneratingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, history: messages })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to contact Groq API server");
      }

      let responseText = data.text || "ORCA AI Core processed your directive.";
      let structuredReport: AIPresetBrief | undefined = undefined;

      const currentQuery = cleanPrompt.toLowerCase();
      if (currentQuery.includes("fir") || currentQuery.includes("report") || currentQuery.includes("briefing") || currentQuery.includes("dossier")) {
        structuredReport = aiReportDatabase["preset-1"];
      }

      // Add assistant response to sync context
      await addMessageToActiveConv(responseText, undefined, structuredReport, "orca", targetConvId);

      if (ttsEnabled) {
        speakText(responseText);
      }
    } catch (err: any) {
      console.error("[Groq Chat Error]:", err);
      const errorMsg = `⚠️ **API Communication Error**: Unable to reach O.C.R.A AI Core backend (${err.message || "Network Error"}). Please verify server connection.`;
      await addMessageToActiveConv(errorMsg, undefined, undefined, "orca", targetConvId);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  // Submit User Prompt
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    const pText = inputText;
    const pAtts = pendingAttachments;
    setInputText("");
    setPendingAttachments([]);
    await submitMessage(pText, pAtts);
  };

  // Listen for global searches targeting the chatbot
  useEffect(() => {
    const handleGlobalSearch = async (e: Event) => {
      const query = (e as CustomEvent).detail;
      if (query) {
        let currentId = activeConvId;
        if (!currentId) {
          currentId = await createConversation("Global Search: " + query);
        }
        await submitMessage(query, [], currentId);
      }
    };
    window.addEventListener("orca_chatbot_search", handleGlobalSearch);
    return () => window.removeEventListener("orca_chatbot_search", handleGlobalSearch);
  }, [activeConvId, createConversation, messages, ttsEnabled]);

  // Professional PDF Exporting Module
  const handleExportPdf = () => {
    if (!activeConv) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker prevented exporting PDF. Please allow popups for this site.");
      return;
    }

    const officerName = officerProfile?.name || "DSP R. K. Shastry";
    const dateStr = new Date().toLocaleString() + " IST";
    
    const messagesHtml = activeConv.messages.map(msg => {
      const senderLabel = msg.sender === "user" ? "Investigating Officer" : "O.C.R.A AI Core";
      
      let formattedText = msg.text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br/>");
      
      if (formattedText.includes("```")) {
        formattedText = formattedText.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code class='language-$1'>$2</code></pre>");
      }

      return `
        <div class="message-card ${msg.sender}">
          <div class="message-meta">${senderLabel} &bull; ${msg.timestamp}</div>
          <div class="message-body">${formattedText}</div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>ORCA_Briefing_${activeConv.title.replace(/\s+/g, "_")}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background: white;
              padding: 40px;
              margin: 0;
            }

            .report-container {
              position: relative;
              min-height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 5rem;
              font-weight: 900;
              color: rgba(0, 31, 63, 0.25);
              z-index: 0;
              pointer-events: none;
              text-align: center;
            }

            .watermark img {
              width: 180px;
              opacity: 0.25;
              margin-bottom: 12px;
            }

            header {
              border-bottom: 2px solid #001f3f;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
              position: relative;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 15px;
            }

            .brand img {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }

            .brand-details {
              display: flex;
              flex-direction: column;
            }

            .brand-title {
              font-weight: 800;
              font-size: 11px;
              color: #0a192f;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-family: 'Inter', sans-serif;
              line-height: 1.1;
            }

            .brand-sub {
              font-size: 8.5px;
              color: #64748b;
              font-family: 'JetBrains Mono', monospace;
              margin-top: 3px;
              letter-spacing: 0.02em;
            }

            .header-meta {
              text-align: right;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10.5px;
              color: #475569;
              line-height: 1.5;
            }

            .doc-title-section {
              margin-bottom: 30px;
              z-index: 10;
              position: relative;
            }

            .doc-title {
              font-size: 20px;
              font-weight: 800;
              color: #001f3f;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: -0.01em;
            }

            .doc-subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }

            .feed-container {
              z-index: 10;
              position: relative;
              flex-grow: 1;
            }

            .message-card {
              margin-bottom: 24px;
              border-left: 3px solid #cbd5e1;
              padding-left: 16px;
            }

            .message-card.user {
              border-left-color: #001f3f;
            }

            .message-card.orca {
              border-left-color: #FF9933;
            }

            .message-meta {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 6px;
              font-family: 'JetBrains Mono', monospace;
            }

            .message-body {
              font-size: 13px;
              line-height: 1.6;
              color: #1e293b;
            }

            pre {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 14px;
              overflow-x: auto;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              color: #0f172a;
              margin: 12px 0;
            }

            code {
              font-family: 'JetBrains Mono', monospace;
              background: #f1f5f9;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 12px;
              color: #0f172a;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 13px;
            }

            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              text-align: left;
            }

            th {
              background: #f8fafc;
              font-weight: 700;
              color: #001f3f;
            }

            footer {
              border-top: 1px solid #cbd5e1;
              padding-top: 15px;
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #94a3b8;
              font-family: 'JetBrains Mono', monospace;
              z-index: 10;
              position: relative;
            }

            .disclaimer {
              max-width: 75%;
              line-height: 1.4;
            }

            @media print {
              body {
                padding: 20px;
              }
              footer {
                position: fixed;
                bottom: 0;
                width: 100%;
              }
              .page-number::after {
                content: counter(page);
              }
            }
          </style>
        </head>
        <body>
          <div class="watermark">
            <img src="/logo.png" alt="Emblem"/>
            <div style="font-size: 3.5rem; font-weight: 900; color: rgba(0, 31, 63, 0.25); letter-spacing: 0.08em; line-height: 1;">O.R.C.A</div>
            <div style="font-size: 1.8rem; margin-top: 6px; color: rgba(0, 31, 63, 0.25); font-weight: bold; letter-spacing: 0.12em; line-height: 1;">CONFIDENTIAL</div>
          </div>
          
          <div class="report-container">
            <header>
              <div class="brand">
                <img src="/logo.png" alt="O.R.C.A Emblem"/>
                <div class="brand-details">
                  <span class="brand-title">O.R.C.A &nbsp;·&nbsp; Organized Crime Analysis Authority</span>
                  <span class="brand-sub">Karnataka State Police &nbsp;·&nbsp; SCRB &nbsp;·&nbsp; AI Intelligence &amp; Crime Analytics Platform</span>
                </div>
              </div>
              <div class="header-meta">
                Ref: BRIEF-${activeConv.id.substring(5, 12).toUpperCase()}<br/>
                Officer: ${officerName}<br/>
                Clearance: ISD-LEVEL-IV
              </div>
            </header>
            
            <div class="doc-title-section">
              <h1 class="doc-title">Forensic Chat Intelligence Report</h1>
              <div class="doc-subtitle">Transcript Log: ${activeConv.title} &bull; Generated ${dateStr}</div>
            </div>
            
            <div class="feed-container">
              ${messagesHtml}
            </div>
            
            <footer>
              <div class="disclaimer">
                CLASSIFICATION: SECURE BRIEFING / CONFIDENTIAL STATE DOCUMENT. This record is electronically generated by the internal police analyzer tool. Storage or disclosure to unauthorized third-parties is subject to police prosecution under IT and Police Codes.
              </div>
              <div class="page-number">Page </div>
            </footer>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Date Grouping logic for conversations
  const groupConversationsByDate = (convs: ChatConversation[]) => {
    const groups: {
      pinned: ChatConversation[];
      today: ChatConversation[];
      yesterday: ChatConversation[];
      prev7days: ChatConversation[];
      older: ChatConversation[];
    } = {
      pinned: [],
      today: [],
      yesterday: [],
      prev7days: [],
      older: []
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    convs.forEach(c => {
      if (c.pinned) {
        groups.pinned.push(c);
        return;
      }
      const cTime = new Date(c.createdAt).getTime();
      if (cTime >= startOfToday) {
        groups.today.push(c);
      } else if (cTime >= startOfYesterday) {
        groups.yesterday.push(c);
      } else if (cTime >= startOf7DaysAgo) {
        groups.prev7days.push(c);
      } else {
        groups.older.push(c);
      }
    });

    return groups;
  };

  // Filter and group conversations
  const filteredConvs = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedConvs = groupConversationsByDate(filteredConvs);

  // Suggestion Prompts Welcome dashboard config
  const welcomeSuggestions = [
    { title: "Generate Intelligence Brief", desc: "Compile incident points for case FIR/2026/BLR/104.", prompt: "Generate a structured police intelligence brief outlining the operational facts and coordinates of FIR/2026/BLR/104." },
    { title: "Explain Evidence Files", desc: "Breakdown metadata check logs of document verification.", prompt: "Audit the document hash parameters of case VER-2026-ISD-CR-9000 and verify chain of custody logs." },
    { title: "Analyze Incident Dossier", desc: "Search Vikram Hegde syndicate network details.", prompt: "Analyze the criminal network graph mapping Vikram Hegde's high-weight financial associates." },
    { title: "Summarize Case Reports", desc: "Synthesize modus operandi mapped to BNS legal clauses.", prompt: "Summarize the legal sections of the active case dossier and list BNS extortion and forgery mappings." },
    { title: "Help Audit Code logs", desc: "Inspect database node timeouts or API logs.", prompt: "Audit the command center active cell fluctuations and telemetry dashboard scoring math." },
    { title: "Statewide Threat Analysis", desc: "List high-risk districts above threat level 8.0.", prompt: "Analyze the Geospatial Heatmap and list districts projecting threat indices exceeding level 8.0." }
  ];

  return (
    <div style={{
      display: "flex",
      height: "100%",
      width: "100%",
      background: "#ffffff",
      overflow: "hidden",
      animation: "fadeIn 0.25s ease"
    }}>
      <style>{`
        .sidebar-chat-card:hover .chat-date-label {
          display: none !important;
        }
        .sidebar-chat-card:hover .chat-card-actions {
          display: flex !important;
        }
      `}</style>
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <div className="no-print" style={{
        width: sidebarExpanded ? "300px" : "68px",
        background: "#0c1524", // Deep obsidian blue to separate from main dashboard navy sidebar
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
        transition: "width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        overflow: "hidden"
      }}>
        
        {/* New Chat Button */}
        <div style={{ padding: sidebarExpanded ? "16px 20px" : "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {sidebarExpanded ? (
            <button
              onClick={() => createConversation()}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #FF9933",
                borderRadius: "8px",
                padding: "10px 16px",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "0.2s"
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,153,51,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Plus style={{ width: 15, height: 15, color: "#FF9933" }} />
              <span>New Case Chat</span>
            </button>
          ) : (
            <button
              onClick={() => createConversation()}
              title="New Chat Session"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "transparent",
                border: "1.5px solid #FF9933",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                margin: "0 auto",
                transition: "0.2s"
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,153,51,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Plus style={{ width: 18, height: 18, color: "#FF9933" }} />
            </button>
          )}
        </div>

        {/* Sticky Search (Only visible when sidebar expanded) */}
        {sidebarExpanded && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(255,255,255,0.35)" }} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "8px 12px 8px 30px",
                  fontSize: "12.5px",
                  color: "white",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>
        )}

        {/* Conversation Folders/Groups list */}
        <div style={{ flex: 1, overflowY: "auto", padding: sidebarExpanded ? "12px 14px" : "8px 0" }}>
          {sidebarExpanded ? (
            /* Grouped scroll list on expanded mode */
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Pinned Folder */}
              {groupedConvs.pinned.length > 0 && (
                <div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#FF9933", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 6, marginBottom: 6 }}>📌 Pinned Cases</div>
                  {groupedConvs.pinned.map(c => renderSidebarCard(c))}
                </div>
              )}

              {/* Today Folder */}
              {groupedConvs.today.length > 0 && (
                <div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 6, marginBottom: 6 }}>🕒 Today</div>
                  {groupedConvs.today.map(c => renderSidebarCard(c))}
                </div>
              )}

              {/* Yesterday Folder */}
              {groupedConvs.yesterday.length > 0 && (
                <div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 6, marginBottom: 6 }}>🕒 Yesterday</div>
                  {groupedConvs.yesterday.map(c => renderSidebarCard(c))}
                </div>
              )}

              {/* Prev 7 Days Folder */}
              {groupedConvs.prev7days.length > 0 && (
                <div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 6, marginBottom: 6 }}>📅 Previous 7 Days</div>
                  {groupedConvs.prev7days.map(c => renderSidebarCard(c))}
                </div>
              )}

              {/* Older Folder */}
              {groupedConvs.older.length > 0 && (
                <div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 6, marginBottom: 6 }}>📁 Older Sessions</div>
                  {groupedConvs.older.map(c => renderSidebarCard(c))}
                </div>
              )}

              {filteredConvs.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                  No case chats registered.
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Icon-only Rail */
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {filteredConvs.map(conv => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    title={conv.title}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                      border: conv.pinned ? "1px solid #FF9933" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "white" : "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                      transition: "0.2s"
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Bot style={{ width: conv.pinned ? 18 : 20, height: conv.pinned ? 18 : 20, color: conv.pinned ? "#FF9933" : "currentColor" }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: sidebarExpanded ? "16px 20px" : "12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.3)",
          flexShrink: 0
        }}>
          {sidebarExpanded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 12 }}>
                <button
                  onClick={() => alert("ISD Profile / Storage configured under: " + officerProfile?.email)}
                  title="Auditor Profile Configurations"
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                >
                  <Settings style={{ width: 15, height: 15 }} />
                </button>
                <button
                  onClick={handleExportPdf}
                  title="Compile A4 Dossier Report"
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                >
                  <Printer style={{ width: 15, height: 15 }} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete all conversations in memory?")) {
                      conversations.forEach(c => deleteConv(c.id));
                    }
                  }}
                  title="Wipe database chats"
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <button
                onClick={handleExportPdf}
                title="Print current brief"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                <Printer style={{ width: 16, height: 16 }} />
              </button>
              <button
                title="ISD Settings node"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                <Settings style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. MAIN CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#f8fafc" }}>
        
        {/* Chat Header */}
        <div className="no-print" style={{
          height: "60px",
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          flexShrink: 0
        }}>
          {/* Header Left: Toggle button + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#001f3f",
                display: "flex",
                alignItems: "center",
                padding: 6,
                borderRadius: 6,
                transition: "background 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              {sidebarExpanded ? <ChevronLeft style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
            
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "14.5px", fontWeight: 700, color: "#001f3f", display: "flex", alignItems: "center", gap: 6 }}>
                {activeConv?.title || "Intelligence Auditing Station"}
                {activeConv?.pinned && <span style={{ color: "#FF9933", fontSize: "12px" }}>📌</span>}
              </h2>
              {activeConv?.moduleContext && (
                <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>
                  Active Context Workflow: {getHumanReadableTab(activeConv.moduleContext)}
                </span>
              )}
            </div>
          </div>

          {/* Header Right: Language select, TTS toggle, print trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Language Selector */}
            <select
              value={speechLanguage}
              onChange={e => setSpeechLanguage(e.target.value)}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                color: "#1e293b",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="en-US">English</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
              <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            </select>

             {/* A4 Export Brief */}
            <button
              onClick={handleExportPdf}
              style={{
                background: "#001f3f",
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Printer style={{ width: 14, height: 14, color: "#FF9933" }} />
              <span>Export Brief</span>
            </button>
          </div>
        </div>

        {/* Scrollable messages and Empty welcome area */}
        <div 
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: messages.length === 0 ? "0" : "32px 32px 40px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {messages.length === 0 ? (
            /* Center welcome screen dashboard layout */
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              maxWidth: 960,
              margin: "0 auto",
              width: "100%",
              textAlign: "center"
            }}>
              {/* Seal Ring */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "linear-gradient(135deg, #001f3f 0%, #002855 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                boxShadow: "0 10px 25px rgba(0,31,63,0.22)",
                border: "1.5px solid rgba(255,153,51,0.4)"
              }}>
                <Bot style={{ width: 34, height: 34, color: "#FF9933" }} />
              </div>

              <h1 style={{
                fontSize: "30px",
                fontWeight: 800,
                color: "#001f3f",
                fontFamily: "var(--font-serif, serif)",
                letterSpacing: "-0.02em"
              }}>
                O.R.C.A's AI Assistant
              </h1>

              <p style={{
                fontSize: "16px",
                color: "#64748b",
                marginTop: 8,
                marginBottom: 32,
                fontWeight: 500
              }}>
                Hello, {officerProfile?.name || "Officer"}. How can I help you today?
              </p>


              {/* Suggestions Prompts Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, width: "100%" }}>
                {welcomeSuggestions.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(card.prompt)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "0.2s transform, 0.2s border-color, 0.2s box-shadow",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#002855";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2.5px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(0,31,63,0.06)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#001f3f", fontWeight: 700, fontSize: "14px" }}>
                      <Sparkles style={{ width: 15, height: 15, color: "#FF9933" }} />
                      <span>{card.title}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: 6, lineHeight: 1.45 }}>
                      {card.desc}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            /* CONVERSATION THREAD */
            <div style={{ maxWidth: "880px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  width: "100%",
                  gap: 8
                }}>
                  {/* Sender meta info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                    {msg.sender === "user" ? (
                      <>
                        <span>Investigating Officer</span>
                        <User style={{ width: 14, height: 14, color: "#002855" }} />
                      </>
                    ) : (
                      <>
                        <Bot style={{ width: 14, height: 14, color: "#FF9933" }} />
                        <span>O.C.R.A AI Core</span>
                      </>
                    )}
                    <span>• {msg.timestamp}</span>
                    {msg.sender === "orca" && (
                      <button 
                        onClick={() => speakText(msg.text)}
                        title="Speech narration"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "#94a3b8" }}
                      >
                        <Volume2 style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  {msg.sender === "user" ? (
                    <div style={{
                      background: "#001f3f",
                      color: "white",
                      padding: "16px 20px",
                      borderRadius: "16px 16px 2px 16px",
                      maxWidth: "80%",
                      fontSize: "14.5px",
                      lineHeight: "1.55",
                      boxShadow: "0 4px 12px rgba(0,31,63,0.12)"
                    }}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {msg.attachments.map((att, i) => (
                            <div key={i} style={{
                              background: "rgba(255,255,255,0.15)",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              gap: 6
                            }}>
                              <FileText style={{ width: 12, height: 12, color: "#FF9933" }} />
                              <span>{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.text}
                    </div>
                  ) : (
                    /* Assistant card */
                    <div style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px 16px 16px 2px",
                      maxWidth: "100%",
                      width: "100%",
                      padding: "24px 28px",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16
                    }}>
                      <div style={{ fontSize: "14.5px", color: "#1e293b", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                        {msg.text.split("\n").map((line, lIdx) => {
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <div key={lIdx} style={{ marginBottom: line.trim() ? 6 : 10 }}>
                              {parts.map((part, pIdx) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return <strong key={pIdx} style={{ color: "#001f3f", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Letterhead embedded police brief component */}
                      {msg.report && (
                        <div style={{ marginTop: 10, border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
                          <div style={{
                            background: "#002855",
                            color: "white",
                            padding: "12px 18px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#FF9933", letterSpacing: "0.08em" }}>
                              SECURE STATE CASE RECORD BRIEFING EMBEDDED
                            </span>
                            <button
                              onClick={() => window.print()}
                              style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "none",
                                color: "white",
                                padding: "5px 12px",
                                borderRadius: 4,
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <Printer style={{ width: 12, height: 12 }} /> Print Brief
                            </button>
                          </div>
                          <div style={{ padding: 20, background: "#ffffff" }}>
                            <Letterhead report={msg.report} loading={false} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Query generating state spinner */}
              {isGeneratingChat && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, width: "fit-content" }}>
                  <Loader2 style={{ width: 18, height: 18, color: "#FF9933", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
                    O.C.R.A AI is auditing statewide crime records...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/*composer area bar fixed at the bottom */}
        <div className="no-print" style={{
            flexShrink: 0,
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "20px 32px 32px",
            display: "flex",
            justifyContent: "center"
          }}>
            <div style={{
              maxWidth: "880px",
              width: "100%",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "24px",
              padding: "12px 20px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              {pendingAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>
                  {pendingAttachments.map((att, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: 16,
                      padding: "4px 10px",
                      fontSize: 12,
                      color: "#1e293b",
                      fontWeight: 600
                    }}>
                      <FileText style={{ width: 14, height: 14, color: "#002855" }} />
                      <span>{att.name}</span>
                      <button onClick={() => removeAttachment(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  type="button"
                  onClick={() => bottomFileInputRef.current?.click()}
                  title="Attach Images or PDF documents"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                >
                  <Paperclip style={{ width: 18, height: 18 }} />
                </button>
                <input
                  type="file"
                  ref={bottomFileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                  multiple
                  style={{ display: "none" }}
                />

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={messages.length === 0 ? "Message ORCA Assistant..." : "Ask ORCA follow-up query..."}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: "13.5px",
                    color: "#1e293b",
                    background: "transparent",
                    fontFamily: "inherit"
                  }}
                />

                {/* Micro Audio capture */}
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  title={isListening ? "Listening... click to stop" : "Voice input transcription"}
                  style={{
                    background: isListening ? "rgba(239, 68, 68, 0.1)" : "none",
                    border: isListening ? "1px solid #ef4444" : "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isListening ? "#ef4444" : "#64748b"
                  }}
                >
                  <Mic style={{ width: 16, height: 16 }} className={isListening ? "animate-pulse" : ""} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!inputText.trim() && pendingAttachments.length === 0}
                  style={{
                    background: (!inputText.trim() && pendingAttachments.length === 0) ? "#cbd5e1" : "#001f3f",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: (!inputText.trim() && pendingAttachments.length === 0) ? "not-allowed" : "pointer"
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          </div>

      </div>
    </div>
  );

  // Render Conversation sidebar card card
  function renderSidebarCard(conv: ChatConversation) {
    const isActive = conv.id === activeConvId;
    const isEditing = editingId === conv.id;
    const formattedDate = new Date(conv.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });

    return (
      <div
        key={conv.id}
        className="sidebar-chat-card"
        onClick={() => !isEditing && setActiveConvId(conv.id)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          minHeight: "54px", // Keeps the box size big and spacious
          borderRadius: "8px",
          background: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
          cursor: "pointer",
          marginBottom: 6,
          transition: "background 0.2s ease",
          position: "relative"
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <Bot style={{ width: 14, height: 14, color: conv.pinned ? "#FF9933" : "rgba(255,255,255,0.45)", flexShrink: 0 }} />
          
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (editTitle.trim()) renameConv(conv.id, editTitle.trim());
                  setEditingId(null);
                } else if (e.key === "Escape") {
                  setEditingId(null);
                }
              }}
              onBlur={() => {
                if (editTitle.trim()) renameConv(conv.id, editTitle.trim());
                setEditingId(null);
              }}
              onClick={e => e.stopPropagation()}
              autoFocus
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid #FF9933",
                borderRadius: 4,
                color: "white",
                fontSize: "12px",
                padding: "2px 6px",
                width: "100%",
                outline: "none"
              }}
            />
          ) : (
            <span style={{
              color: "white",
              fontSize: "12.5px", // Title font size is small, clean, and legible
              fontWeight: isActive ? 600 : 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {conv.title}
            </span>
          )}
        </div>

        {/* Right slot: Swap Date for Actions on Hover */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "54px", flexShrink: 0, marginLeft: 8, position: "relative" }}>
          
          {/* Date is hidden when hovered or when menu is active */}
          <span 
            className="chat-date-label" 
            style={{ 
              fontSize: "10.5px", 
              color: "rgba(255,255,255,0.35)",
              display: activeMenuId === conv.id ? "none" : "block"
            }}
          >
            {formattedDate}
          </span>

          {/* Actions fade in on hover or when action menu is active */}
          {!isEditing && (
            <div
              className="chat-card-actions"
              style={{
                display: activeMenuId === conv.id ? "flex" : "none",
                alignItems: "center",
                gap: 6,
                zIndex: 50
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => pinConv(conv.id, !conv.pinned)}
                title={conv.pinned ? "Unpin case" : "Pin case"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: conv.pinned ? "#FF9933" : "rgba(255,255,255,0.4)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Pin style={{ width: 13, height: 13 }} />
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                  }}
                  title="More actions"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: activeMenuId === conv.id ? "white" : "rgba(255,255,255,0.4)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <MoreHorizontal style={{ width: 13, height: 13 }} />
                </button>

                {activeMenuId === conv.id && (
                  <div style={{
                    position: "absolute",
                    top: "22px",
                    right: "0",
                    background: "#0c1524",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    padding: "4px 0",
                    minWidth: "100px",
                    zIndex: 100
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(conv.id);
                        setEditTitle(conv.title);
                        setActiveMenuId(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.8)",
                        padding: "6px 12px",
                        fontSize: "12.5px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                    >
                      <Edit2 style={{ width: 12, height: 12, color: "rgba(255,255,255,0.5)" }} />
                      <span>Rename</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Wipe conversation "${conv.title}"?`)) {
                          deleteConv(conv.id);
                        }
                        setActiveMenuId(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        padding: "6px 12px",
                        fontSize: "12.5px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                    >
                      <Trash2 style={{ width: 12, height: 12, color: "#ef4444" }} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};
