import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Logo, Wordmark } from '../common/Logo';
import { Avatar } from '../common/Avatar';

export const OnboardingScreen: React.FC = () => {
  const { registerUser } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isValid = cleanUsername.length >= 2;

  // Anteprima live dell'avatar che il server assegnerà a questo username
  const previewAvatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(cleanUsername || 'wa2')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Questo nome non va bene. Scegline uno più decente.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser(cleanUsername);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Non è andata. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 26px 30px 26px',
        backgroundColor: 'var(--bg-app)',
        position: 'relative'
      }}
      className="animate-fade-in"
    >
      <div className="chat-wallpaper" />

      {/* Brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '24px',
          zIndex: 2,
          textAlign: 'center'
        }}
      >
        <Logo size={96} glow style={{ marginBottom: '18px' }} />
        <Wordmark fontSize={27} />
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '270px',
            lineHeight: '1.5',
            marginTop: '10px',
            marginBottom: 0
          }}
        >
          Un nome. Niente password, niente storie.
        </p>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.6px',
            color: 'var(--brand-gold)',
            marginTop: '8px',
            textTransform: 'uppercase'
          }}
        >
          — L'Onorevole Lisi
        </span>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '330px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          gap: '18px'
        }}
      >
        <div className="animate-pop-in" style={{ marginBottom: '2px' }}>
          <Avatar
            src={previewAvatarUrl}
            name={cleanUsername || 'wa2'}
            size="xl"
          />
        </div>

        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--input-bg)',
              border: `1.5px solid ${error ? 'var(--danger-red)' : 'var(--input-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '0 16px',
              height: '52px',
              transition: 'border-color 0.2s'
            }}
          >
            <span style={{ color: 'var(--brand-mint)', fontSize: '16px', fontWeight: 700, marginRight: '4px' }}>
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="il_tuo_username"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
              aria-label="Username"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--input-text)',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: error ? 'var(--danger-red)' : 'var(--text-muted)',
              marginTop: '7px',
              paddingLeft: '4px',
              minHeight: '15px'
            }}
          >
            {error || 'Lettere minuscole, numeri, underscore. Basta così.'}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="btn-primary"
          style={{
            width: '100%',
            height: '52px',
            fontSize: '16px',
            borderRadius: 'var(--radius-lg)',
            opacity: !isValid ? 0.55 : 1,
            cursor: isValid ? 'pointer' : 'default'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Un secondo.</span>
            </>
          ) : (
            <>
              <span>Entra</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '7px', opacity: 0.75 }}>
        <Logo size={15} style={{ borderRadius: '5px', boxShadow: 'none' }} />
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', letterSpacing: '0.2px' }}>
          Qui dentro si parla chiaro.
        </span>
      </div>
    </div>
  );
};
