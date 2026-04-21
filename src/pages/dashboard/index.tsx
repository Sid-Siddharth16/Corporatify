import Navbar from '../../components/navbar';
import InputBox from './components/InputBox';
import OutputBox from './components/OutputBox';
import RotatingText, { DEFAULT_ROTATING_TEXTS } from './components/RotatingText';
import { useDashboardWorkspace } from './helper';
import type { DashboardSidebarChat } from './helper';
import './dashboard.scss';

/**
 * Authenticated dashboard: navbar plus full converter workspace (formerly `Home.jsx`).
 * Layout stays here; state and handlers come from `useDashboardWorkspace` in `helper.ts`.
 */
function DashboardPage() {
  const {
    inputValue,
    outputValue,
    tone,
    isLoading,
    isCopied,
    errorMessage,
    chatHistory,
    activeChatId,
    openMenuChatId,
    setTone,
    setInputValue,
    setOpenMenuChatId,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleConvert,
    handleCopy,
    handleClearOutput,
    handleMoveToEditor,
  } = useDashboardWorkspace();

  return (
    <main className="dashboard-page">
      <Navbar />
      <section className="dashboard-home" aria-label="Corporatify converter workspace">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar" aria-label="Chat history sidebar">
            <button type="button" className="dashboard-sidebar__new-chat" onClick={handleNewChat}>
              + New chat
            </button>

            <div className="dashboard-sidebar__list" role="list" aria-label="Recent chats">
              {chatHistory.length ? (
                chatHistory.map((chat: DashboardSidebarChat) => (
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
                        onClick={() =>
                          setOpenMenuChatId((previousId: string) => (previousId === chat.id ? '' : chat.id))
                        }
                      >
                        ...
                      </button>
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
        {errorMessage ? (
          <p className="dashboard-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
