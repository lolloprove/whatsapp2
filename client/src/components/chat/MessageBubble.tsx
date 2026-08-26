import React, { useState } from 'react';
import type { ChatMessage } from '../../types/chat';
import { formatMessageTime } from '../../utils/dateUtils';
import { Check, CheckCheck, Clock, AlertCircle, X } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  const isSending = message.status === 'sending';
  const isFailed = message.status === 'failed';
  const content = message.translatedContent || message.originalContent;

  const isImage = message.mediaType === 'image' && Boolean(message.mediaUrl);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
          margin: '2.5px 0',
          padding: '0 6px',
          width: '100%'
        }}
        className="animate-pop-in"
      >
        <div
          style={{
            maxWidth: isImage ? '80%' : '82%',
            minWidth: '92px',
            background: isMe ? 'var(--bubble-out)' : 'var(--bubble-in)',
            color: isMe ? 'var(--bubble-out-text)' : 'var(--bubble-in-text)',
            borderRadius: isMe ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
            padding: isImage ? '4px 4px 6px 4px' : '7px 11px 6px 11px',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            wordBreak: 'break-word',
            border: isFailed ? '1px solid var(--danger-red)' : 'none'
          }}
        >
          {/* Immagine allegata */}
          {isImage && message.mediaUrl && (
            <div
              onClick={() => setIsPhotoViewerOpen(true)}
              style={{
                cursor: 'pointer',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '4px',
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}
            >
              <img
                src={message.mediaUrl}
                alt="Foto allegata"
                style={{
                  width: '100%',
                  maxHeight: '240px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          )}

          {/* Testo del messaggio (tradotto se disponibile) */}
          {(!isImage || content) && (
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.42',
                fontWeight: 400,
                color: 'inherit',
                userSelect: 'text',
                padding: isImage ? '2px 6px' : '0'
              }}
            >
              {content}
            </div>
          )}

          {/* Ora + spunte */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
              fontSize: '11px',
              color: isMe ? 'var(--bubble-meta-out)' : 'var(--bubble-meta)',
              lineHeight: '12px',
              marginTop: '3px',
              float: 'right',
              marginLeft: '8px'
            }}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            {isMe && (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {isSending ? (
                  <Clock size={11} />
                ) : isFailed ? (
                  <AlertCircle size={12} color="var(--danger-red)" />
                ) : message.status === 'read' ? (
                  <CheckCheck size={14} color="var(--tick-read)" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Viewer foto a schermo intero */}
      {isPhotoViewerOpen && message.mediaUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 8, 5, 0.96)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsPhotoViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPhotoViewerOpen(false)}
            aria-label="Chiudi foto"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              color: '#ffffff'
            }}
          >
            <X size={22} />
          </button>
          <img
            src={message.mediaUrl}
            alt="Foto a schermo intero"
            style={{
              maxWidth: '100%',
              maxHeight: '90dvh',
              borderRadius: '10px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </>
  );
};
