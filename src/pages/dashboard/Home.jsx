import { useRef, useState } from 'react';
import InputBox from './components/InputBox';
import OutputBox from './components/OutputBox';
import RotatingText, { DEFAULT_ROTATING_TEXTS } from './components/RotatingText';
import { corporatifyMessage } from '../../services/aiService';

/**
 * Hosts the Corporatify workspace by composing input/output panels.
 * @returns {JSX.Element} Split-layout converter view with API integration.
 */
function Home() {
  // Creates a lightweight unique ID for chat history entries.
  const createChatId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  // Derives a short sidebar title so long messages stay readable inside the chat list.
  const buildChatTitle = (text) => text.trim().slice(0, 42) || 'Untitled chat';

  // Stores user-entered raw text that will be sent to Gemini.
  const [inputValue, setInputValue] = useState('');
  // Stores converted professional output returned by the API.
  const [outputValue, setOutputValue] = useState('');
  // Tracks selected communication style for conversion prompts.
  const [tone, setTone] = useState('Polite');
  // Prevents duplicate conversion requests while a call is in progress.
  const [isLoading, setIsLoading] = useState(false);
  // Adds an immediate synchronous lock so rapid double-clicks cannot fire multiple API calls before state updates.
  const convertInFlightRef = useRef(false);
  // Provides brief visual confirmation after successful clipboard copy.
  const [isCopied, setIsCopied] = useState(false);
  // Shows user-friendly errors without crashing the dashboard.
  const [errorMessage, setErrorMessage] = useState('');
  // Tracks all local chat sessions shown in the sidebar so users can revisit recent prompts.
  const [chatHistory, setChatHistory] = useState([]);
  // Indicates which chat is active so the selected item can be highlighted and restored.
  const [activeChatId, setActiveChatId] = useState('');
  // Stores the currently opened action menu to support per-chat delete controls.
  const [openMenuChatId, setOpenMenuChatId] = useState('');

  /**
   * Starts a fresh chat draft by clearing current editor state.
   * Keeps prior sessions in history and closes any open chat actions menu.
   * @returns {void}
   */
  const handleNewChat = () => {
    setInputValue('');
    setOutputValue('');
    setErrorMessage('');
    setIsCopied(false);
    setActiveChatId('');
    setOpenMenuChatId('');
  };

  /**
   * Loads a historical chat into the editor panes.
   * @param {{ id: string; input: string; output: string; tone: string }} chat Chat record selected from sidebar.
   * @returns {void}
   */
  const handleSelectChat = (chat) => {
    setInputValue(chat.input);
    setOutputValue(chat.output);
    setTone(chat.tone);
    setErrorMessage('');
    setIsCopied(false);
    setActiveChatId(chat.id);
    setOpenMenuChatId('');
  };

  /**
   * Removes a chat from local history and safely resets editor state if it was active.
   * @param {string} chatId Identifier of chat to delete.
   * @returns {void}
   */
  const handleDeleteChat = (chatId) => {
    setChatHistory((previousChats) => previousChats.filter((chat) => chat.id !== chatId));
    setOpenMenuChatId('');

    // Clears the workspace when deleting the currently selected chat so stale content is not shown.
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  /**
   * Converts user input to professional language using Gemini.
   * Handles empty input, loading state, and recoverable failures.
   * @returns {Promise<void>} Resolves when conversion flow completes.
   */
  const handleConvert = async () => {
    // Guards against repeated clicks that can happen before React applies the disabled state.
    if (convertInFlightRef.current) {
      return;
    }

    if (!inputValue.trim()) {
      setErrorMessage('Please enter a message before converting.');
      setOutputValue('');
      return;
    }

    convertInFlightRef.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setIsCopied(false);

    try {
      const convertedText = await corporatifyMessage(inputValue, tone);
      setOutputValue(convertedText);
      const chatId = activeChatId || createChatId();
      // Upserts the current conversation into local history so the sidebar always reflects latest content.
      setChatHistory((previousChats) => {
        const updatedChat = {
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
      // Uses service-provided message so users see specific actions (for example, quota setup issues).
      setOutputValue('');
      const readableError = error instanceof Error ? error.message : 'Conversion failed. Please try again.';
      setErrorMessage(readableError);
      console.error('Corporatify conversion error:', error);
    } finally {
      // Releases request lock whether conversion succeeded or failed.
      convertInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  /**
   * Copies output text for quick reuse in chat, tickets, or email.
   * @returns {Promise<void>} Resolves after clipboard operation completes.
   */
  const handleCopy = async () => {
    if (!outputValue.trim()) {
      return;
    }

    try {
      await window.navigator.clipboard.writeText(outputValue);
      setIsCopied(true);
      // Resets label after feedback delay so button returns to default text.
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      setErrorMessage('Unable to copy output. Please copy manually.');
      console.error('Clipboard error:', error);
    }
  };

  /**
   * Clears only the output area so users can quickly reset generated content.
   * @returns {void}
   */
  const handleClearOutput = () => {
    setOutputValue('');
    setIsCopied(false);
  };

  /**
   * Moves generated output back into the input editor for iterative refinement.
   * @returns {void}
   */
  const handleMoveToEditor = () => {
    if (!outputValue.trim()) {
      return;
    }
    // Copies output into input so users can continue editing from the polished version.
    setInputValue(outputValue);
    // Clears output after move to match requested "move to editor" behavior.
    setOutputValue('');
    setIsCopied(false);
  };

  return (
    <section className="dashboard-home" aria-label="Corporatify converter workspace">
      <div className="dashboard-layout">
        {/* Sidebar mirrors modern chat tools by exposing quick new chat and recent thread access. */}
        <aside className="dashboard-sidebar" aria-label="Chat history sidebar">
          <button type="button" className="dashboard-sidebar__new-chat" onClick={handleNewChat}>
            + New chat
          </button>

          <div className="dashboard-sidebar__list" role="list" aria-label="Recent chats">
            {chatHistory.length ? (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`dashboard-chat-item ${activeChatId === chat.id ? 'dashboard-chat-item--active' : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="dashboard-chat-item__select"
                    onClick={() => handleSelectChat(chat)}
                    title={chat.title}
                  >
                    {chat.title}
                  </button>
                  <div className="dashboard-chat-item__actions">
                    <button
                      type="button"
                      className="dashboard-chat-item__menu-trigger"
                      aria-label={`Open actions for ${chat.title}`}
                      onClick={() => setOpenMenuChatId((previousId) => (previousId === chat.id ? '' : chat.id))}
                    >
                      ...
                    </button>
                    {/* Context menu keeps destructive actions tucked away, similar to ChatGPT thread controls. */}
                    {openMenuChatId === chat.id ? (
                      <div className="dashboard-chat-item__menu">
                        <button type="button" onClick={() => handleDeleteChat(chat.id)}>
                          Delete chat
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="dashboard-sidebar__empty">Your recent chats will appear here.</p>
            )}
          </div>
        </aside>

        <div className="dashboard-main">
          {/* Animated tagline banner sits above both editors without changing existing panel interactions. */}
          <RotatingText texts={DEFAULT_ROTATING_TEXTS} interval={2800} />
          <div className="dashboard-grid">
            <InputBox
              inputValue={inputValue}
              onInputChange={setInputValue}
              tone={tone}
              onToneChange={setTone}
              onConvert={handleConvert}
              isLoading={isLoading}
            />
            <OutputBox
              outputValue={outputValue}
              onCopy={handleCopy}
              onClearOutput={handleClearOutput}
              onMoveToEditor={handleMoveToEditor}
              isCopied={isCopied}
            />
          </div>
        </div>
      </div>
      {/* Centralized error region keeps alert messaging consistent and accessible. */}
      {errorMessage ? (
        <p className="dashboard-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

export default Home;
