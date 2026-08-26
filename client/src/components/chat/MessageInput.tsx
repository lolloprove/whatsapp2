import React, { useState, useRef, useEffect } from 'react';
import { Smile, Send, Plus, Image, Camera, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface MessageInputProps {
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: 'image' | 'audio' | 'document') => Promise<void>;
  onTypingStatus: (isTyping: boolean) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '👋', '😎', '🍕', '✨', '👏'];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingStatus,
  disabled = false
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasText = text.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [text]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    onTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStatus(false);
    }, 1500);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    setText('');
    setShowEmojiPicker(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTypingStatus(false);
    }

    try {
      await onSendMessage(trimmed);
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Upload immagine reale (galleria/fotocamera del dispositivo)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setShowAttachmentSheet(false);
        await onSendMessage(text.trim() || 'Foto', base64Url, 'image');
        setText('');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openPicker = () => fileInputRef.current?.click();

  const attachOptionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '6px 0'
  };

  const attachCircleStyle: React.CSSProperties = {
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f2fff9'
  };

  return (
    <div
      style={{
        background: 'var(--bg-chat-footer)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 10,
        position: 'relative',
        flexShrink: 0
      }}
      className="safe-bottom"
    >
      {/* Input file nascosto per il picker reale */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Barra emoji rapida */}
      {showEmojiPicker && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'var(--panel-header)',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          className="animate-pop-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                style={{
                  fontSize: '21px',
                  padding: '4px',
                  borderRadius: '8px',
                  minWidth: '34px',
                  height: '34px'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowEmojiPicker(false)}
            aria-label="Chiudi emoji"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Riga composer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          padding: '7px 8px'
        }}
      >
        <button
          type="button"
          className="btn-icon"
          onClick={() => setShowAttachmentSheet(true)}
          title="Allega foto"
          aria-label="Allega foto"
          style={{ width: '40px', height: '40px', color: 'var(--text-secondary)' }}
        >
          <Plus size={24} />
        </button>

        {/* Contenitore input arrotondato */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            background: 'var(--input-bg)',
            borderRadius: 'var(--radius-xl)',
            padding: '3px 8px 3px 4px',
            minHeight: '44px',
            border: '1px solid var(--input-border)'
          }}
        >
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
            aria-label="Apri emoji"
            style={{
              width: '36px',
              height: '36px',
              color: showEmojiPicker ? 'var(--brand-mint)' : 'var(--text-secondary)'
            }}
          >
            <Smile size={22} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Messaggio"
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--input-text)',
              fontSize: '15px',
              fontFamily: 'inherit',
              lineHeight: '20px',
              resize: 'none',
              maxHeight: '110px',
              padding: '8px 4px 6px 4px'
            }}
          />

          {!hasText && (
            <button
              type="button"
              className="btn-icon"
              onClick={openPicker}
              title="Invia foto"
              aria-label="Invia foto"
              style={{ width: '36px', height: '36px', color: 'var(--text-secondary)' }}
            >
              <Camera size={20} />
            </button>
          )}
        </div>

        {/* Pulsante invio con gradiente del brand */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!hasText || isSending || disabled}
          aria-label="Invia messaggio"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: hasText ? 'var(--brand-gradient)' : 'var(--panel-active)',
            color: hasText ? '#f2fff9' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: hasText ? 'var(--brand-glow)' : 'none',
            flexShrink: 0,
            cursor: hasText ? 'pointer' : 'default',
            transition: 'background 0.18s ease, box-shadow 0.18s ease'
          }}
          className={hasText ? 'animate-pop-in' : undefined}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </div>

      {/* Sheet allegati: solo azioni reali */}
      <BottomSheet
        isOpen={showAttachmentSheet}
        onClose={() => setShowAttachmentSheet(false)}
        title="Condividi"
      >
        <div
          style={{
            padding: '18px 24px 28px 24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '36px',
            textAlign: 'center'
          }}
        >
          <div onClick={openPicker} style={attachOptionStyle} role="button">
            <div style={{ ...attachCircleStyle, background: 'var(--brand-gradient)', boxShadow: 'var(--brand-glow)' }}>
              <Image size={24} />
            </div>
            <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>Galleria</span>
          </div>

          <div onClick={openPicker} style={attachOptionStyle} role="button">
            <div style={{ ...attachCircleStyle, background: 'var(--panel-active)', border: '1px solid var(--border-color)', color: 'var(--brand-mint)' }}>
              <Camera size={24} />
            </div>
            <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>Fotocamera</span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
