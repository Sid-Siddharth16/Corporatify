import { useRef, useState } from 'react';
import { corporatifyMessage } from '../../services/aiService';

/**
 * Tone values match `ToneSelector` options and the AI service contract.
 */
export type DashboardTone = 'Polite' | 'Very Polite' | 'Passive Aggressive';

/**
 * One row in the sidebar chat list (flattened thread for this UI).
 */
export type DashboardSidebarChat = {
  id: string;
  title: string;
  input: string;
  output: string;
  tone: DashboardTone;
};

/**
 * Creates a lightweight unique id for chat history entries.
 */
const createChatId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

/**
 * Derives a short sidebar title from the first line of user input.
 * @param text Raw input used for the conversion.
 */
const buildChatTitle = (text: string): string => text.trim().slice(0, 42) || 'Untitled chat';

/**
 * Return type for the dashboard workspace hook (all state + handlers for `index.tsx`).
 */
export type UseDashboardWorkspaceReturn = {
  inputValue: string;
  setInputValue: (value: string) => void;
  outputValue: string;
  tone: DashboardTone;
  setTone: (tone: DashboardTone) => void;
  isLoading: boolean;
  isCopied: boolean;
  errorMessage: string;
  chatHistory: DashboardSidebarChat[];
  activeChatId: string;
  openMenuChatId: string;
  setOpenMenuChatId: (value: string | ((previous: string) => string)) => void;
  handleNewChat: () => void;
  handleSelectChat: (chat: DashboardSidebarChat) => void;
  handleDeleteChat: (chatId: string) => void;
  handleConvert: () => Promise<void>;
  handleCopy: () => Promise<void>;
  handleClearOutput: () => void;
  handleMoveToEditor: () => void;
};

/**
 * Encapsulates Corporatify dashboard workspace state: chat sidebar, convert API, copy/clear/move.
 * Keeps `index.tsx` focused on layout while all side effects and updates live here.
 */
export const useDashboardWorkspace = (): UseDashboardWorkspaceReturn => {
  const [inputValue, setInputValue] = useState<string>('');
  const [outputValue, setOutputValue] = useState<string>('');
  const [tone, setTone] = useState<DashboardTone>('Polite');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const convertInFlightRef = useRef<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<DashboardSidebarChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [openMenuChatId, setOpenMenuChatId] = useState<string>('');

  const handleNewChat = () => {
    setInputValue('');
    setOutputValue('');
    setErrorMessage('');
    setIsCopied(false);
    setActiveChatId('');
    setOpenMenuChatId('');
  };

  const handleSelectChat = (chat: DashboardSidebarChat) => {
    setInputValue(chat.input);
    setOutputValue(chat.output);
    setTone(chat.tone);
    setErrorMessage('');
    setIsCopied(false);
    setActiveChatId(chat.id);
    setOpenMenuChatId('');
  };

  const handleDeleteChat = (chatId: string) => {
    setChatHistory((previousChats) => previousChats.filter((chat) => chat.id !== chatId));
    setOpenMenuChatId('');
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  const handleConvert = async () => {
    if (convertInFlightRef.current === true) {
      return;
    }

    if (!inputValue.trim()) {
      setErrorMessage('Please enter a message before converting.');
      setOutputValue('');
      return;
    }

    convertInFlightRef.current = true as const;
    setIsLoading(true);
    setErrorMessage('');
    setIsCopied(false);

    try {
      const convertedText: string = await corporatifyMessage(inputValue, tone);
      setOutputValue(convertedText);
      const chatId = activeChatId || createChatId();
      setChatHistory((previousChats) => {
        const updatedChat: DashboardSidebarChat = {
          id: chatId,
          title: buildChatTitle(inputValue),
          input: inputValue,
          output: convertedText,
          tone,
        };
        const withoutCurrent = previousChats.filter((chat) => chat.id !== chatId);
        return [updatedChat, ...withoutCurrent];
      });
      setActiveChatId(chatId);
      if (!convertedText) {
        setErrorMessage('No response received. Please try again.');
      }
    } catch (error) {
      setOutputValue('');
      const readableError = error instanceof Error ? error.message : 'Conversion failed. Please try again.';
      setErrorMessage(readableError);
      console.error('Corporatify conversion error:', error);
    } finally {
      convertInFlightRef.current = false as const;
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!outputValue.trim()) {
      return;
    }
    try {
      await window.navigator.clipboard.writeText(outputValue);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false as const), 1500);
    } catch (error) {
      setErrorMessage('Unable to copy output. Please copy manually.');
      console.error('Clipboard error:', error);
    }
  };

  const handleClearOutput = () => {
    setOutputValue('');
    setIsCopied(false as const);
  };

  const handleMoveToEditor = () => {
    if (!outputValue.trim()) {
      return;
    }
    setInputValue(outputValue);
    setOutputValue('');
    setIsCopied(false as const);
  };

  return {
    inputValue,
    setInputValue,
    outputValue,
    tone,
    setTone,
    isLoading,
    isCopied,
    errorMessage,
    chatHistory,
    activeChatId,
    openMenuChatId,
    setOpenMenuChatId,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleConvert,
    handleCopy,
    handleClearOutput,
    handleMoveToEditor,
  };
};
