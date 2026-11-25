import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// One-click demo accounts (only shown when VITE_DEMO_MODE=true, i.e. local demo)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_PASSWORD = 'password123';
const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@rgipt.ac.in', desc: 'Apply & track NOCs', color: 'bg-indigo-500' },
  { role: 'Dept. Officer', email: 'officer@rgipt.ac.in', desc: 'CSE first-level review', color: 'bg-amber-500' },
  { role: 'Chairman T&P', email: 'tnphead@rgipt.ac.in', desc: 'Final approval', color: 'bg-emerald-500' },
  { role: 'TNP Office', email: 'tnpoffice@rgipt.ac.in', desc: 'Hand over & mark collected', color: 'bg-sky-500' },
  { role: 'CDC Chairperson', email: 'cdc@rgipt.ac.in', desc: 'Oversight (read-only)', color: 'bg-violet-500' },
  { role: 'Admin', email: 'admin@rgipt.ac.in', desc: 'Departments & roles', color: 'bg-rose-500' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const doLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setError('invalid_credentials');
      } else if (status === 404) {
        setError('not_found');
      } else {
        setError(message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center -mt-8">
      <div className="bg-white flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl mx-4 border border-slate-100">

        {/* Left Side: Graphic */}
        <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 text-white p-12 justify-center items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

          <img src="/rgipt_logo.png" alt="RGIPT Logo" className="w-32 h-auto mb-8 z-10 drop-shadow-xl" />
          <h2 className="text-4xl font-extrabold mb-4 z-10 text-center tracking-tight text-white drop-shadow">RGIPT NOC Portal</h2>
          <p className="text-blue-100 text-center z-10 max-w-sm text-lg font-medium leading-relaxed">Empowering students with seamless, digitized no-objection certificate workflows.</p>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 sm:p-14 w-full flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium mb-8">Please enter your credentials to access your account.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 text-sm">
                <div className="flex items-start gap-2 text-red-600 font-medium">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  <span>
                    {error === 'invalid_credentials'
                      ? 'Incorrect email or password.'
                      : error === 'not_found'
                      ? 'No account found with this email.'
                      : error}
                  </span>
                </div>
                {(error === 'invalid_credentials' || error === 'not_found') && (
                  <div className="mt-2 pl-7">
                    {error === 'not_found' ? (
                      <span className="text-slate-600">
                        Want to create one?{' '}
                        <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register here</Link>
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        Forgot your password?{' '}
                        <Link to="/forgot-password" className="text-indigo-600 font-bold hover:underline">Reset it here</Link>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. 21cs101@rgipt.ac.in"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm pr-16"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot your password?</Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 transform transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {DEMO_MODE && (
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-100 bg-indigo-50">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-700">Demo Credentials</p>
                  <p className="text-xs text-slate-600">
                    Password: <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{DEMO_PASSWORD}</code>
                  </p>
                </div>
                <ul className="divide-y divide-indigo-100/70">
                  {DEMO_ACCOUNTS.map(acc => (
                    <li key={acc.email} className={'flex items-center gap-3 px-4 py-2.5 transition-colors ' + (email === acc.email ? 'bg-white' : 'hover:bg-white/70')}>
                      <button
                        type="button"
                        title="Fill the login form with these credentials"
                        onClick={() => { setEmail(acc.email); setPassword(DEMO_PASSWORD); setError(''); }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className={'w-2 h-2 rounded-full shrink-0 ' + acc.color} />
                          <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{acc.role}</span>
                          <span className="hidden sm:inline text-[11px] text-slate-400 truncate">· {acc.desc}</span>
                        </div>
                        <p className="font-mono text-xs text-slate-600 mt-0.5 ml-4 truncate">{acc.email}</p>
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => { setEmail(acc.email); setPassword(DEMO_PASSWORD); doLogin(acc.email, DEMO_PASSWORD); }}
                        className="shrink-0 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        Login →
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500 text-center px-4 py-2 border-t border-indigo-100">
                  Click a role to fill the form, or <strong>Login →</strong> to sign in directly.
                </p>
              </div>
            )}

            <div className="mt-8 text-center text-sm font-medium text-slate-600">
              Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline ml-1">Register here</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
