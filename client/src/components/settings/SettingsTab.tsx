import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Logo } from '../common/Logo';
import { isSoundEnabled, setSoundEnabled } from '../../utils/soundUtils';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  LogOut,
  ChevronRight,
  Check,
  RefreshCw
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

export const SettingsTab: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || 'Disponibile');
  const [avatarSeed, setAvatarSeed] = useState(user?.username || 'user');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentAvatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`;

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const handleOpenEdit = () => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setStatusMessage(user.statusMessage || 'Disponibile');
      setAvatarSeed(user.username || 'user');
    }
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(fullName, statusMessage, currentAvatarUrl, username);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditProfileOpen(false);
      }, 900);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 18px',
    gap: '14px',
    cursor: 'pointer'
  };

  const groupStyle: React.CSSProperties = {
    backgroundColor: 'var(--panel-header)',
    borderRadius: 'var(--radius-lg)',
    margin: '0 14px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--input-text)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit'
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-sidebar)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          minHeight: '62px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <h1 style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Impostazioni
        </h1>
      </div>

      <div style={{ padding: '4px 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Card profilo */}
        <div style={groupStyle}>
          <div onClick={handleOpenEdit} style={rowStyle} role="button">
            <Avatar src={user?.avatarUrl} name={user?.fullName || 'Me'} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '16.5px', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                {user?.fullName}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.statusMessage || `@${user?.username}`}
              </div>
            </div>
            <ChevronRight size={19} color="var(--text-muted)" />
          </div>
        </div>

        {/* Preferenze reali */}
        <div style={groupStyle}>
          <div
            onClick={toggleTheme}
            style={{ ...rowStyle, borderBottom: '1px solid var(--border-color)' }}
            role="button"
          >
            {theme === 'dark' ? <Moon size={21} color="var(--brand-mint)" /> : <Sun size={21} color="var(--accent-gold)" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tema
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? 'Scuro' : 'Chiaro'}
              </div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-mint)' }}>
              Cambia
            </span>
          </div>

          <div onClick={handleToggleSound} style={rowStyle} role="button">
            {soundOn ? <Volume2 size={21} color="var(--brand-mint)" /> : <VolumeX size={21} color="var(--text-muted)" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Suoni
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {soundOn ? 'Feedback sonoro attivo' : 'Silenzioso'}
              </div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-mint)' }}>
              {soundOn ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <div style={groupStyle}>
          <div onClick={logout} style={rowStyle} role="button">
            <LogOut size={21} color="var(--danger-red)" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--danger-red)' }}>
              Esci
            </span>
          </div>
        </div>

        {/* Footer brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            marginTop: '10px',
            opacity: 0.7
          }}
        >
          <Logo size={16} style={{ borderRadius: '5px', boxShadow: 'none' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            WhatsApp 2
          </span>
        </div>
      </div>

      {/* Sheet modifica profilo */}
      <BottomSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Modifica profilo"
      >
        <form onSubmit={handleSaveProfile} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar src={currentAvatarUrl} name={fullName || username || 'User'} size="xl" />
            <button
              type="button"
              onClick={() => setAvatarSeed(Math.random().toString(36).substring(2, 8))}
              style={{
                marginTop: '10px',
                fontSize: '13px',
                color: 'var(--brand-mint)',
                fontWeight: 700,
                gap: '6px'
              }}
            >
              <RefreshCw size={14} /> Cambia avatar
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
              Nome
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
              Info
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
            style={{ width: '100%', height: '48px', marginTop: '6px' }}
          >
            {saveSuccess ? (
              <>
                <Check size={18} /> Salvato
              </>
            ) : isSaving ? (
              'Salvataggio...'
            ) : (
              'Salva'
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
