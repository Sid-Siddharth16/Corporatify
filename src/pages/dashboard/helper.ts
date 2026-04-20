import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Centralized tone options used by dashboard selector and conversion logic.
 */
export type ToneOption = 'polite' | 'very-polite' | 'passive-aggressive';

/**
 * Represents one saved conversion item in a chat thread.
 */
export type ChatEntry = {
  id: string;
  input: string;
  output: string;
  tone: ToneOption;
  createdAt: number;
};

/**
 * Represents a single sidebar conversation containing conversion history.
 */
export type DashboardChat = {
  id: string;
  title: string;
  createdAt: number;
  entries: ChatEntry[];
};

/**
 * LocalStorage key used to persist dashboard conversations between refreshes.
 */
const DASHBOARD_CHATS_STORAGE_KEY = 'corporatify_dashboard_chats';

/**
 * Return shape for dashboard logic hook so the page component stays presentational.
 */
type UseDashboardConverterReturn = {
  chats: DashboardChat[];
  activeChatId: string;
  activeChatTitle: string;
  rawThoughts: string;
  corporateVersion: string;
  tone: ToneOption;
  isConverting: boolean;
  isCopied: boolean;
  setRawThoughts: (value: string) => void;
  handleToneChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleConvert: () => void;
  handleCopy: () => Promise<void>;
  handleMoveToEditor: () => void;
  handleSelectChat: (chatId: string) => void;
  handleCreateChat: () => void;
  handleDeleteChat: (chatId: string) => void;
};

/**
 * Builds a stable id for local-only chat and message records.
 * @returns Unique identifier string.
 */
const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Generates a short chat title from initial message text.
 * @param message First raw message in a chat.
 * @returns Human-readable compact title for sidebar listing.
 */
const getChatTitleFromMessage = (message: string): string => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return 'New chat';
  }
  return trimmedMessage.length > 36 ? `${trimmedMessage.slice(0, 36)}...` : trimmedMessage;
};

/**
 * Reads saved chats from localStorage and falls back safely on parse errors.
 * @returns Previously saved dashboard chats or an empty array.
 */
const readSavedChats = (): DashboardChat[] => {
  try {
    const saved = window.localStorage.getItem(DASHBOARD_CHATS_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved) as DashboardChat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Creates a brand-new empty chat so users can start a fresh conversation.
 * @returns Initialized empty chat object.
 */
const createEmptyChat = (): DashboardChat => ({
  id: createId(),
  title: 'New chat',
  createdAt: Date.now(),
  entries: [],
});

/**
 * Converts user text into corporate language and manages UX state (loading/copy/tone).
 * Also persists and restores chat history for a ChatGPT-like sidebar experience.
 * @returns Converter state, chat history, and handlers used by dashboard UI controls.
 */
export const useDashboardConverter = (): UseDashboardConverterReturn => {
  // Holds all saved dashboard conversations shown in the left sidebar.
  const [chats, setChats] = useState<DashboardChat[]>(() => {
    const savedChats = readSavedChats();
    return savedChats.length > 0 ? savedChats : [createEmptyChat()];
  });
  // Tracks which chat thread is currently active in the workspace.
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const savedChats = readSavedChats();
    return savedChats[0]?.id ?? createEmptyChat().id;
  });
  // Captures the user's raw thought before it is rewritten into corporate language.
  const [rawThoughts, setRawThoughts] = useState<string>('');
  // Stores the final converted message shown in the output panel.
  const [corporateVersion, setCorporateVersion] = useState<string>('');
  // Tracks selected conversion style for controlled tone adjustments.
  const [tone, setTone] = useState<ToneOption>('polite');
  // Prevents duplicate conversion requests while simulated processing is in progress.
  const [isConverting, setIsConverting] = useState<boolean>(false);
  // Gives quick feedback when output text is copied successfully.
  const [isCopied, setIsCopied] = useState<boolean>(false);

  /**
   * Keeps active chat id valid when chats change (e.g., first load/fallback cases).
   */
  useEffect(() => {
    if (!chats.some((chat) => chat.id === activeChatId)) {
      setActiveChatId(chats[0]?.id ?? '');
    }
  }, [chats, activeChatId]);

  /**
   * Persists chat history whenever conversations are updated.
   */
  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_CHATS_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];

  /**
   * Syncs current input/output fields from the selected chat's latest message.
   */
  useEffect(() => {
    if (!activeChat) {
      return;
    }
    const latestEntry = activeChat.entries[0];
    setRawThoughts(latestEntry?.input ?? '');
    setCorporateVersion(latestEntry?.output ?? '');
    setTone(latestEntry?.tone ?? 'polite');
  }, [activeChatId]); // Intentional dependency keeps state updates tied to user chat selection.

  /**
   * Converts direct language into polished corporate phrasing based on selected tone.
   * @param message Raw user-provided text to be rewritten.
   * @returns Professionalized message adapted to the chosen communication style.
   */
  const createCorporateMessage = (message: string): string => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return '';
    }

    // Uses tone-specific wrappers so the same intent can be expressed with different corporate voices.
    if (tone === 'very-polite') {
      return `Thank you for your patience. To align expectations, I wanted to share that ${trimmedMessage.charAt(0).toLowerCase()}${trimmedMessage.slice(1)}. I truly appreciate your understanding and collaboration on this.`;
    }
    if (tone === 'passive-aggressive') {
      return `Just a friendly note for alignment: ${trimmedMessage}. As always, I value everyone's continued attention to detail so we can avoid unnecessary follow-ups.`;
    }
    return `For alignment, I wanted to highlight that ${trimmedMessage.charAt(0).toLowerCase()}${trimmedMessage.slice(1)}. Please let me know if you would like me to share additional context.`;
  };

  /**
   * Keeps tone updates type-safe and colocated with converter business logic.
   * @param event Select change event containing next tone value.
   */
  const handleToneChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTone(event.target.value as ToneOption);
  };

  /**
   * Handles conversion action and displays a short loading state for clear UX feedback.
   */
  const handleConvert = () => {
    if (!rawThoughts.trim()) {
      return;
    }

    setIsConverting(true);
    // Simulates processing time so users clearly see conversion feedback.
    window.setTimeout(() => {
      const convertedMessage = createCorporateMessage(rawThoughts);
      const nextEntry: ChatEntry = {
        id: createId(),
        input: rawThoughts.trim(),
        output: convertedMessage,
        tone,
        createdAt: Date.now(),
      };

      // Prepends the newest conversion to the active chat and updates title from first meaningful message.
      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title: chat.entries.length === 0 ? getChatTitleFromMessage(nextEntry.input) : chat.title,
                entries: [nextEntry, ...chat.entries],
              }
            : chat,
        ),
      );
      setCorporateVersion(convertedMessage);
      setIsConverting(false);
    }, 800);
  };

  /**
   * Copies converted output to clipboard for quick reuse in email/chat tools.
   * @returns Promise resolved once clipboard operation completes.
   */
  const handleCopy = async () => {
    if (!corporateVersion.trim()) {
      return;
    }

    await window.navigator.clipboard.writeText(corporateVersion);
    setIsCopied(true);
    // Resets copied state so button text can return to default after acknowledgement.
    window.setTimeout(() => setIsCopied(false), 1500);
  };

  /**
   * Moves generated corporate output back into the raw editor for iterative refinement.
   */
  const handleMoveToEditor = () => {
    if (!corporateVersion.trim()) {
      return;
    }

    setRawThoughts(corporateVersion);
  };

  /**
   * Switches the active conversation and resets transient UI feedback state.
   * @param chatId Id of the chat selected from sidebar.
   */
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsCopied(false);
    setIsConverting(false);
  };

  /**
   * Creates a new empty chat and immediately focuses it for the user.
   */
  const handleCreateChat = () => {
    const nextChat = createEmptyChat();
    setChats((previousChats) => [nextChat, ...previousChats]);
    setActiveChatId(nextChat.id);
    setRawThoughts('');
    setCorporateVersion('');
    setTone('polite');
    setIsCopied(false);
    setIsConverting(false);
  };

  /**
   * Deletes a chat thread and safely reassigns active chat so the workspace always has one chat available.
   * @param chatId Id of chat selected for deletion from sidebar action menu.
   */
  const handleDeleteChat = (chatId: string) => {
    setChats((previousChats) => {
      const remainingChats = previousChats.filter((chat) => chat.id !== chatId);

      // Keeps at least one available thread so UI never enters an empty broken state.
      if (remainingChats.length === 0) {
        const fallbackChat = createEmptyChat();
        setActiveChatId(fallbackChat.id);
        return [fallbackChat];
      }

      // When deleting the active chat, switch to the newest remaining chat for continuity.
      if (chatId === activeChatId) {
        setActiveChatId(remainingChats[0].id);
      }

      return remainingChats;
    });
    setIsCopied(false);
    setIsConverting(false);
  };

  return {
    chats,
    activeChatId,
    activeChatTitle: activeChat?.title ?? 'New chat',
    rawThoughts,
    corporateVersion,
    tone,
    isConverting,
    isCopied,
    setRawThoughts,
    handleToneChange,
    handleConvert,
    handleCopy,
    handleMoveToEditor,
    handleSelectChat,
    handleCreateChat,
    handleDeleteChat,
  };
};
