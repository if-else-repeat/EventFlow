import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'ef_token';
const OP_KEY    = 'ef_operator';
const EVENT_KEY = 'ef_event';

export function useAuth() {
  const [token,    setToken]    = useState(() => localStorage.getItem(TOKEN_KEY));
  const [operator, setOperator] = useState(() => { try { return JSON.parse(localStorage.getItem(OP_KEY)); } catch { return null; } });
  const [event,    setEvent]    = useState(() => { try { return JSON.parse(localStorage.getItem(EVENT_KEY)); } catch { return null; } });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function login(phone, event_code) {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, event_code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return false; }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(OP_KEY,    JSON.stringify(data.operator));
      localStorage.setItem(EVENT_KEY, JSON.stringify(data.event));
      setToken(data.token); setOperator(data.operator); setEvent(data.event);
      return true;
    } catch {
      setError('Network error. Check your connection.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    [TOKEN_KEY, OP_KEY, EVENT_KEY].forEach(k => localStorage.removeItem(k));
    setToken(null); setOperator(null); setEvent(null);
  }

  return { token, operator, event, loading, error, login, logout, isLoggedIn: !!token };
}
