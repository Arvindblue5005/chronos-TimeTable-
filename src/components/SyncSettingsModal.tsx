import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { UserPreferences } from '../types/timetable';
import { generateSecurePassphrase, generateVaultId } from '../utils/crypto';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (updated: Partial<UserPreferences>) => void;
  onTriggerSync: () => Promise<{ success: boolean; message: string }>;
  onPairRemoteVault: (vaultId: string, passphrase: string) => Promise<{ success: boolean; message: string }>;
  isOnline: boolean;
  lastSyncTime?: string;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onTriggerSync,
  onPairRemoteVault,
  isOnline,
  lastSyncTime,
}) => {
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Pairing tab states
  const [targetVaultId, setTargetVaultId] = useState('');
  const [targetPassphrase, setTargetPassphrase] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  if (!isOpen) return null;

  const pairingUrl = `${window.location.origin}?vault=${encodeURIComponent(
    preferences.vaultId
  )}&key=${encodeURIComponent(preferences.encryptionPassphrase)}`;

  const copyToClipboard = (text: string, type: 'key' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await onTriggerSync();
    setIsSyncing(false);
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVaultId.trim() || !targetPassphrase.trim()) return;

    setIsPairing(true);
    setPairError(null);
    const res = await onPairRemoteVault(targetVaultId.trim(), targetPassphrase.trim());
    setIsPairing(false);
    if (res.success) {
      onClose();
    } else {
      setPairError(res.message);
    }
  };

  const handleGenerateNewVault = () => {
    if (window.confirm('Generate a brand new Vault ID and Passphrase? Current local schedule will be encrypted under the new key.')) {
      onSavePreferences({
        vaultId: generateVaultId(),
        encryptionPassphrase: generateSecurePassphrase(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-white">
                Multi-Device Sync & End-to-End Encryption
              </h3>
              <p className="text-xs text-slate-400">
                Zero-knowledge AES-256-GCM encrypted sync across mobile & desktop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5 text-xs">
          {/* Security Banner */}
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/60 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              <span className="font-semibold text-indigo-200">Zero-Knowledge Guarantee: </span>
              Your timetable is encrypted in your browser using PBKDF2 (100,000 iterations) and AES-256-GCM. The sync server only stores encrypted ciphertext blobs. No one can read your tasks without your passphrase.
            </div>
          </div>

          {/* Current Device Vault Details */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">This Device's Sync Vault</span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {isOnline ? 'Online · Live Sync Active' : 'Offline · Local Vault Active'}
              </span>
            </div>

            {/* Vault ID */}
            <div>
              <label className="block text-slate-400 mb-1">Vault Identifier</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={preferences.vaultId}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(preferences.vaultId, 'key')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Passphrase */}
            <div>
              <label className="block text-slate-400 mb-1">Secret Encryption Passphrase</label>
              <div className="flex items-center gap-2">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  readOnly
                  value={preferences.encryptionPassphrase}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassphrase ? 'Hide key' : 'Show key'}
                >
                  {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(preferences.encryptionPassphrase, 'key')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Sync Now Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {lastSyncTime ? `Last synced: ${lastSyncTime}` : 'Continuous local & cloud sync'}
              </span>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSync}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {syncFeedback && (
              <p className="text-xs text-indigo-400 pt-1">{syncFeedback}</p>
            )}
          </div>

          {/* Device Pairing: Link Mobile or Desktop */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              Pair Another Mobile or Desktop Device
            </h4>
            <p className="text-slate-400 text-xs">
              To sync your schedule onto another phone or laptop, open Chronos on that device and either click the 1-click pairing link below or enter this Vault ID and Passphrase.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pairingUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-300 text-xs truncate"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(pairingUrl, 'link')}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy 1-Click Link'}</span>
              </button>
            </div>
          </div>

          {/* Join / Pair Existing Vault from another device */}
          <form onSubmit={handlePairSubmit} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              Connect to an Existing Vault
            </h4>
            <p className="text-slate-400 text-xs">
              Have a Vault from another device? Enter its credentials to decrypt and sync it here.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Remote Vault ID</label>
                <input
                  type="text"
                  placeholder="e.g. ch-8k9m2"
                  value={targetVaultId}
                  onChange={(e) => setTargetVaultId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Remote Passphrase</label>
                <input
                  type="password"
                  placeholder="Secret passphrase..."
                  value={targetPassphrase}
                  onChange={(e) => setTargetPassphrase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {pairError && <p className="text-rose-400 text-xs">{pairError}</p>}

            <button
              type="submit"
              disabled={isPairing}
              className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              {isPairing ? 'Connecting & Decrypting...' : 'Link & Decrypt Vault'}
            </button>
          </form>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            type="button"
            onClick={handleGenerateNewVault}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Regenerate Vault Keys
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
