'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json().catch(() => ({ message: 'Registration failed' }));
    if (res.ok) {
      setMessage('Registration successful. You can now log in.');
      setName('');
      setEmail('');
      setPassword('');
    } else {
      setMessage(data.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '520px' }}>
      <div className="card">
        <h1>Create your learning account</h1>
        <p style={{ marginTop: '0.5rem', color: 'rgba(44,44,44,0.7)' }}>
          Access ethics and compliance training tailored to your organisation.
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <input
            className="input"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        {message && (
          <div style={{ marginTop: '1rem', color: message.includes('successful') ? 'var(--color-secondary)' : '#B00020' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
