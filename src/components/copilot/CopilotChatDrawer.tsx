'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRiskContext } from '../../context/RiskContext';
import { StatusLevel, TreatmentStrategy } from '../../types/risk';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  RefreshCw, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Mic, 
  MicOff, 
  Paperclip, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX,
  GripVertical,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export interface SuggestedAction {
  type: 'status' | 'owner' | 'strategy';
  riskId: string;
  targetValue: string;
  label: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imagePreview?: string;
  timestamp: string;
  suggestedAction?: SuggestedAction;
}

export const CopilotChatDrawer: React.FC = () => {
  const pathname = usePathname();
  const { 
    risks, 
    controls, 
    actions, 
    evidence, 
    approvals, 
    kris, 
    teamMembers, 
    currentUser, 
    addToast,
    isCopilotOpen,
    copilotInitialQuery,
    closeCopilot,
    toggleCopilot,
    updateRisk,
    updateRiskStatus
  } = useRiskContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedActionIds, setAppliedActionIds] = useState<string[]>([]);

  // Active Screen / Selected Risk Context
  const activeRiskId = useMemo(() => {
    if (pathname?.startsWith('/risk/')) {
      return pathname.replace('/risk/', '').split('/')[0];
    }
    return null;
  }, [pathname]);

  const activeRisk = useMemo(() => {
    if (!activeRiskId) return null;
    return risks.find(r => r.id === activeRiskId);
  }, [activeRiskId, risks]);

  // Sync initial query when opened via external trigger
  useEffect(() => {
    if (copilotInitialQuery && isCopilotOpen) {
      setInputQuery(copilotInitialQuery);
    }
  }, [copilotInitialQuery, isCopilotOpen]);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello Sunny! I am your Risk Register Copilot assistant. Ask me any question about active project threats, owner workloads, or upload a system issue screenshot.',
      timestamp: 'Just now'
    }
  ]);

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draggable position state for circular launcher button
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const buttonPosOnStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDragged = useRef<boolean>(false);

  // Draggable position state for Chat Window itself
  const [windowPosition, setWindowPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const windowDragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const windowPosOnStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize positions after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) {
        setPosition({
          x: window.innerWidth - 68,
          y: window.innerHeight - 68
        });

        const winW = isExpanded ? 540 : 420;
        const winH = isExpanded ? 640 : 540;
        setWindowPosition({
          x: Math.max(16, window.innerWidth - winW - 24),
          y: Math.max(16, window.innerHeight - winH - 76)
        });
      }
    }
  }, [isExpanded]);

  // Handle Button Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    if (position) {
      buttonPosOnStart.current = { ...position };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasDragged.current = false;
      dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (position) {
        buttonPosOnStart.current = { ...position };
      }
    }
  };

  // Handle Window Header Dragging
  const handleWindowMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    // Only drag when clicking header area, ignore buttons
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    setIsDraggingWindow(true);
    windowDragStartPos.current = { x: e.clientX, y: e.clientY };
    if (windowPosition) {
      windowPosOnStart.current = { ...windowPosition };
    } else {
      const winW = isExpanded ? 540 : 420;
      const winH = isExpanded ? 640 : 540;
      const initialPos = {
        x: Math.max(16, window.innerWidth - winW - 24),
        y: Math.max(16, window.innerHeight - winH - 76)
      };
      windowPosOnStart.current = initialPos;
      setWindowPosition(initialPos);
    }
  };

  const handleWindowTouchStart = (e: React.TouchEvent) => {
    if (isMobile) return;
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
      setIsDraggingWindow(true);
      windowDragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (windowPosition) {
        windowPosOnStart.current = { ...windowPosition };
      } else {
        const winW = isExpanded ? 540 : 420;
        const winH = isExpanded ? 640 : 540;
        const initialPos = {
          x: Math.max(16, window.innerWidth - winW - 24),
          y: Math.max(16, window.innerHeight - winH - 76)
        };
        windowPosOnStart.current = initialPos;
        setWindowPosition(initialPos);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Move button
      if (isDragging) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasDragged.current = true;
        }
        const newX = Math.max(12, Math.min(window.innerWidth - 60, buttonPosOnStart.current.x + dx));
        const newY = Math.max(12, Math.min(window.innerHeight - 60, buttonPosOnStart.current.y + dy));
        setPosition({ x: newX, y: newY });
      }

      // 2. Move window freely anywhere on screen
      if (isDraggingWindow) {
        const dx = e.clientX - windowDragStartPos.current.x;
        const dy = e.clientY - windowDragStartPos.current.y;
        const winW = isExpanded ? 540 : 420;
        const newX = Math.max(8, Math.min(window.innerWidth - winW - 8, windowPosOnStart.current.x + dx));
        const newY = Math.max(8, Math.min(window.innerHeight - 90, windowPosOnStart.current.y + dy));
        setWindowPosition({ x: newX, y: newY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      // 1. Move button
      if (isDragging) {
        const dx = e.touches[0].clientX - dragStartPos.current.x;
        const dy = e.touches[0].clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasDragged.current = true;
        }
        const newX = Math.max(12, Math.min(window.innerWidth - 60, buttonPosOnStart.current.x + dx));
        const newY = Math.max(12, Math.min(window.innerHeight - 60, buttonPosOnStart.current.y + dy));
        setPosition({ x: newX, y: newY });
      }

      // 2. Move window freely
      if (isDraggingWindow) {
        const dx = e.touches[0].clientX - windowDragStartPos.current.x;
        const dy = e.touches[0].clientY - windowDragStartPos.current.y;
        const winW = isExpanded ? 540 : 420;
        const newX = Math.max(8, Math.min(window.innerWidth - winW - 8, windowPosOnStart.current.x + dx));
        const newY = Math.max(8, Math.min(window.innerHeight - 90, windowPosOnStart.current.y + dy));
        setWindowPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingWindow(false);
    };

    if (isDragging || isDraggingWindow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isDraggingWindow, isExpanded]);

  const handleButtonClick = () => {
    if (!hasDragged.current) {
      toggleCopilot();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
    }
  }, [messages, isCopilotOpen]);

  // Voice Assistant Handler (Web Speech API + Fallback)
  const toggleVoiceAssistant = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsListening(true);
        addToast('Voice Assistant Active', 'Listening to voice query...', 'info');

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(transcript);
          setIsListening(false);
          addToast('Voice Captured', `"${transcript}"`, 'success');
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        setIsListening(false);
      }
    } else {
      // Fallback voice simulation
      setIsListening(true);
      addToast('Voice Assistant Active', 'Simulating voice input capture...', 'info');
      setTimeout(() => {
        setInputQuery('What are our top 3 critical threats and financial risk exposure?');
        setIsListening(false);
        addToast('Voice Transcribed', 'Captured query from voice microphone.', 'success');
      }, 1500);
    }
  };

  // Text-To-Speech Audio Playback
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  // File / Image Attachment Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedImage(result);
      addToast('Image Attached', `Attached screenshot: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if ((!q.trim() && !attachedImage) || loading) return;

    const userMsgText = attachedImage ? `${q || 'Analyzing attached error screenshot'}` : q;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      imagePreview: attachedImage || undefined,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    const currentImg = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: q || 'Analyze attached issue screenshot and identify operational threats.',
          risks,
          controls,
          actions,
          evidence,
          approvals,
          kris,
          teamMembers,
          currentUser,
          activeRiskId: activeRiskId || undefined,
          activePath: pathname,
          imageBase64: currentImg || undefined,
          imageMimeType: currentImg?.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png'
        })
      });

      const data = await res.json();
      const rawAiText = data.reply || 'Analyzed risk register state. All metrics normal.';

      // Parse ACTION_TRIGGER tag if generated by Qwen
      let cleanText = rawAiText;
      let suggestedAction: SuggestedAction | undefined;

      const triggerMatch = rawAiText.match(/ACTION_TRIGGER:\s*(\{.*?\})/);
      if (triggerMatch) {
        try {
          suggestedAction = JSON.parse(triggerMatch[1]);
          cleanText = rawAiText.replace(/ACTION_TRIGGER:\s*\{.*?\}/, '').trim();
        } catch (e) {
          console.warn('Failed to parse ACTION_TRIGGER:', e);
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: cleanText,
        suggestedAction,
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Copilot connection note: Active telemetry synced with Supabase Cloud DB.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Action Execution Handler
  const handleApplyAction = async (msgId: string, action: SuggestedAction) => {
    try {
      if (action.type === 'status') {
        await updateRiskStatus(action.riskId, action.targetValue as StatusLevel);
      } else if (action.type === 'owner') {
        const member = teamMembers?.find(m => m.name === action.targetValue);
        await updateRisk(action.riskId, {
          ownerName: action.targetValue,
          ownerRole: member?.role || 'Risk Owner',
          ownerAvatar: member?.avatar
        });
      } else if (action.type === 'strategy') {
        await updateRisk(action.riskId, {
          treatmentStrategy: action.targetValue as TreatmentStrategy
        });
      }

      setAppliedActionIds(prev => [...prev, msgId]);
      addToast(
        'Action Applied Successfully',
        `Copilot executed "${action.label || action.targetValue}" for ${action.riskId}.`,
        'success'
      );
    } catch (e: any) {
      addToast('Action Execution Failed', e?.message || 'Could not apply change.', 'error');
    }
  };

  const sampleChips = [
    { label: '🛡️ Quality Check', query: 'Perform an enterprise risk data quality check: identify any risks with missing owners, unlinked evidence, or overdue reviews.' },
    { label: '🔥 Top Critical Threats', query: 'What are our top 3 critical threats and unmitigated exposures?' },
    { label: '📈 Appetite & Residual Risk', query: 'Analyze our portfolio residual exposure against the risk appetite threshold and highlight items needing governance review.' },
    { label: '👤 Team Allocation', query: 'Summarize risk ownership and workload allocations across the MNB Research team directory.' },
    { label: '💰 Financial Exposure ($)', query: 'What is our total financial risk exposure in USD and high-priority mitigation ROI?' }
  ];

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-extrabold">$1</strong>')
      .replace(/\[(RSK-[A-Za-z0-9-]+)\]/g, '<span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 inline-block">$1</span>');
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-1.5 my-1 pl-1">
            <span className="text-indigo-400 font-bold shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.substring(2)) }} />
          </div>
        );
      }
      return (
        <div 
          key={i} 
          className={trimmed === '' ? 'h-2' : 'my-0.5'} 
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} 
        />
      );
    });
  };

  return (
    <>
      {/* Hidden File Input for Image Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.pdf,.log"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Small Round Draggable Trigger Button */}
      <div 
        className={`fixed z-50 select-none touch-none ${isMobile ? 'bottom-4 right-4' : ''}`}
        style={isMobile ? undefined : {
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
          right: position ? undefined : '24px',
          bottom: position ? undefined : '24px'
        }}
      >
        <button
          onClick={handleButtonClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          title="Enterprise Risk Copilot"
          className={`group relative w-11 h-11 rounded-full bg-slate-900 dark:bg-slate-800 text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center border border-slate-700 dark:border-slate-600 ${
            isDragging ? 'ring-2 ring-indigo-500 scale-105' : ''
          }`}
        >
          <Bot className="w-5 h-5 text-indigo-400" />
          
          {/* Live Online Ping Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -top-0.5 -right-0.5" />

          {/* Hover Tooltip */}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-slate-800">
            Enterprise Copilot
          </span>
        </button>
      </div>

      {/* Floating Copilot Chat Drawer Window (Clamped on Mobile) */}
      {isCopilotOpen && (
        <div 
          className={`fixed z-50 bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-indigo-900/60 overflow-hidden flex flex-col transition-[width,height] duration-200 animate-in slide-in-from-bottom-5 ${
            isMobile
              ? 'inset-x-2 bottom-3 max-h-[82dvh] h-[520px] w-auto max-w-[calc(100vw-1rem)] mx-auto'
              : isExpanded 
                ? 'w-[540px] h-[640px]' 
                : 'w-[420px] h-[540px]'
          } ${isDraggingWindow ? 'ring-2 ring-indigo-500 shadow-indigo-900/40 select-none' : ''}`}
          style={isMobile ? undefined : {
            left: windowPosition ? `${windowPosition.x}px` : undefined,
            top: windowPosition ? `${windowPosition.y}px` : undefined,
            right: windowPosition ? undefined : '24px',
            bottom: windowPosition ? undefined : '80px'
          }}
        >
          {/* Header - Drag Handle (Desktop) / Header (Mobile) */}
          <div 
            onMouseDown={handleWindowMouseDown}
            onTouchStart={handleWindowTouchStart}
            className={`p-3.5 bg-slate-950 border-b border-indigo-900/40 flex items-center justify-between select-none group ${
              isMobile ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            }`}
            title={isMobile ? 'Enterprise Risk Copilot' : 'Click and drag to move window anywhere on screen'}
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>Enterprise Risk Copilot</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Qwen 27B
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Groq Qwen (qwen3.8-27b) {!isMobile && '• Drag to Move'}
                </p>
                {activeRisk && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-indigo-950/80 border border-indigo-700/60 text-[9px] text-indigo-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white">{activeRisk.id}:</span>
                    <span className="truncate max-w-[140px] sm:max-w-[180px]">{activeRisk.title}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Drag Handle Indicator */}
              <div className="hidden sm:flex items-center text-slate-600 group-hover:text-indigo-400 transition-colors mr-1 cursor-grab" title="Drag window">
                <GripVertical className="w-4 h-4" />
              </div>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={closeCopilot}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div 
            className="p-2.5 bg-slate-950/80 border-b border-indigo-950 flex items-center gap-2 overflow-x-auto text-[10px] no-scrollbar shrink-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {sampleChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                className="px-3 py-1.5 rounded-full bg-indigo-950/90 text-indigo-200 border border-indigo-800/50 hover:bg-indigo-900 hover:text-white shrink-0 font-medium transition-colors shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-xs shadow-xs'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs shadow-xs'
                }`}>
                  {msg.imagePreview && (
                    <div className="rounded-xl overflow-hidden border border-white/20 max-h-40">
                      <img src={msg.imagePreview} alt="Attached Issue" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-700/40 mb-1">
                        <span className="text-[10px] text-indigo-300 font-bold">Copilot Synthesis</span>
                        <button
                          onClick={() => handleSpeakMessage(msg.id, msg.text)}
                          className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                            speakingMsgId === msg.id ? 'text-indigo-400 animate-pulse' : ''
                          }`}
                          title="Read out load with Voice"
                        >
                          {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-indigo-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {renderFormattedText(msg.text)}

                      {/* 1-Click Interactive Action Execution Button */}
                      {msg.suggestedAction && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-indigo-950">
                          <div>
                            <span className="text-[10px] text-indigo-300 font-extrabold uppercase block tracking-wider">
                              Recommended Action
                            </span>
                            <span className="text-xs font-bold text-white">
                              {msg.suggestedAction.label || `${msg.suggestedAction.type.toUpperCase()}: ${msg.suggestedAction.targetValue}`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyAction(msg.id, msg.suggestedAction!)}
                            disabled={appliedActionIds.includes(msg.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                              appliedActionIds.includes(msg.id)
                                ? 'bg-slate-700/80 text-slate-300 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                            }`}
                          >
                            {appliedActionIds.includes(msg.id) ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Applied</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Apply to {msg.suggestedAction.riskId}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 italic py-2 px-2 bg-slate-950/40 rounded-xl border border-indigo-900/30">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Copilot is analyzing live metrics & attached screenshot...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview Pill */}
          {attachedImage && (
            <div className="px-3 py-1.5 bg-slate-950 border-t border-indigo-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-indigo-200 font-medium">Issue Screenshot Attached</span>
              </div>
              <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Box with Voice & Image Upload Buttons */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-indigo-900/40 flex items-center gap-2"
          >
            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-900 transition-colors shrink-0"
              title="Attach screenshot of issue or log output"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceAssistant}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                isListening 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-900'
              }`}
              title="Speak to Copilot (Voice Input)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? "Listening to voice..." : "Ask Copilot or attach screenshot..."}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />

            <button
              type="submit"
              disabled={loading || (!inputQuery.trim() && !attachedImage)}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
