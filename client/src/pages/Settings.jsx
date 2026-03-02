import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [translations, setTranslations] = useState([]);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getTranslations().then(setTranslations).catch(console.error);

    // Check push notification support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      checkPushSubscription();
    }
  }, []);

  async function checkPushSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushSubscribed(!!sub);
    } catch (err) {
      console.error('Push check error:', err);
    }
  }

  async function handleSave(key, value) {
    setSaving(true);
    try {
      const updated = await api.updateSettings({ [key]: value });
      setSettings(updated);
      showMessage('Settings saved');
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function subscribePush() {
    try {
      const { publicKey } = await api.getVapidKey();
      const reg = await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await api.subscribePush(sub.toJSON());
      setPushSubscribed(true);
      showMessage('Push notifications enabled');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        showMessage('Notification permission denied. Please enable notifications in your browser settings.', true);
      } else {
        showMessage(err.message, true);
      }
    }
  }

  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setPushSubscribed(false);
      showMessage('Push notifications disabled');
    } catch (err) {
      showMessage(err.message, true);
    }
  }

  async function handleTestNotification() {
    try {
      await api.testPush();
      showMessage('Test notification sent!');
    } catch (err) {
      showMessage(err.message, true);
    }
  }

  function showMessage(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div>
      <h3 className="card-title mb-16">Settings</h3>

      {message && (
        <div className={message.isError ? 'error-msg' : 'success-msg'}>
          {message.text}
        </div>
      )}

      {/* Translation */}
      <div className="card">
        <h4 style={{ marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          Bible Translation
        </h4>
        <select
          className="form-select"
          value={settings.translation || 'kjv'}
          onChange={e => handleSave('translation', e.target.value)}
          disabled={saving}
        >
          {translations.map(t => (
            <option key={t.key} value={t.key}>{t.name}</option>
          ))}
          {translations.length === 0 && (
            <option value="kjv">King James Version</option>
          )}
        </select>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 6 }}>
          Additional translations (ESV, NASB, NIV, NKJV, CSB) available by adding API keys in .env
        </p>
      </div>

      {/* Notifications */}
      <div className="card">
        <h4 style={{ marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          Morning Notifications
        </h4>

        {!pushSupported ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
            Push notifications are not supported in this browser. Try installing the app on your home screen.
          </p>
        ) : (
          <>
            <div className="flex-between mb-8">
              <span style={{ fontSize: '0.9rem' }}>Push notifications</span>
              <button
                className={`btn btn-sm ${pushSubscribed ? 'btn-danger' : 'btn-primary'}`}
                onClick={pushSubscribed ? unsubscribePush : subscribePush}
              >
                {pushSubscribed ? 'Disable' : 'Enable'}
              </button>
            </div>

            {pushSubscribed && (
              <button
                className="btn btn-sm btn-secondary mb-8"
                onClick={handleTestNotification}
              >
                Send test notification
              </button>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notification time</label>
              <input
                type="time"
                className="form-input"
                value={settings.notification_time || '06:00'}
                onChange={e => handleSave('notification_time', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Install */}
      <div className="card">
        <h4 style={{ marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          Install App
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
          To get morning devotions on your phone:<br />
          1. Open this app in your phone's browser<br />
          2. Tap "Add to Home Screen" (or "Install App")<br />
          3. Enable push notifications in Settings<br />
          4. Set your preferred wake-up time above
        </p>
      </div>

      {/* About */}
      <div className="card">
        <h4 style={{ marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          About Sola Devotion
        </h4>
        <p style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '0.95rem',
          color: 'var(--brown-light)',
          marginBottom: 8,
        }}>
          "For from him and through him and to him are all things. To him be glory forever. Amen."
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
          Romans 11:36 — Built in the tradition of the Reformed faith.
        </p>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
