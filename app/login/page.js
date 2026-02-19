'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Determine which field to use for login
      const loginData = loginMethod === 'email' 
        ? { email: formData.email, password: formData.password }
        : { phone: formData.phone, password: formData.password };

      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();

      if (res.ok) {
        // Save user info and token
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        
        // Dispatch custom event for navbar update in same tab
        window.dispatchEvent(new Event('authChange'));
        
        // Redirect based on role
        if (data.isAdmin) {
          router.push('/admin');
        } else if (data.isFarmer) {
          router.push('/farmer');
        } else {
          router.push('/');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your AgriPack account</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Login Method Toggle */}
        <div className="login-method-toggle">
          <button
            type="button"
            className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
            onClick={() => setLoginMethod('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
            onClick={() => setLoginMethod('phone')}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {loginMethod === 'email' ? (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+254 700 000 000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'right' }}>
            <Link href="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link href="/register" className="auth-link">Create one</Link>
        </p>
      </div>

      <style jsx>{`
        .login-method-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: var(--radius);
        }

        .method-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border-radius: var(--radius);
          font-weight: 500;
          transition: var(--transition);
        }

        .method-btn.active {
          background: var(--primary);
          color: white;
        }

        .forgot-link {
          font-size: 0.875rem;
          color: var(--primary);
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          color: var(--text-secondary);
        }

        .auth-link {
          color: var(--primary);
          font-weight: 600;
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
