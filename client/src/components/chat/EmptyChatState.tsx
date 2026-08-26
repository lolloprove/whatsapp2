import React from 'react';
import { Logo, Wordmark } from '../common/Logo';

interface EmptyChatStateProps {
  onStartNewChat?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onStartNewChat }) => {
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        background: 'var(--bg-chat-body)',
        position: 'relative'
      }}
      className="animate-fade-in"
    >
      <div className="chat-wallpaper" />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '340px',
          zIndex: 2
        }}
      >
        <Logo size={76} glow style={{ marginBottom: '18px' }} />
        <Wordmark fontSize={21} />

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.55',
            color: 'var(--text-secondary)',
            marginTop: '12px',
            marginBottom: '22px'
          }}
        >
          La chat è vuota. Trova qualcuno e scrivigli.
        </p>

        {onStartNewChat && (
          <button
            type="button"
            className="btn-primary"
            onClick={onStartNewChat}
            style={{ fontSize: '14px', padding: '11px 22px' }}
          >
            Nuova chat
          </button>
        )}
      </div>
    </div>
  );
};
