import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.endsWith('@kovon.io')) {
      setError('Invalid email domain. Please use a @kovon.io email address.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setMessage('Check your email for the login link!');
    } catch (error) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>CLM Platform Login</h1>
        <p>Enter your @kovon.io email to receive a magic link.</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input type="email" placeholder="your.email@kovon.io" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '8px', fontSize: '16px' }} />
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Magic Link'}</button>
        </form>
        {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;