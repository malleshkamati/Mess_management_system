import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Utensils, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleFormChange = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let result;
        if (isLogin) {
            result = await login(email, password);
        } else {
            if (!name.trim()) {
                setError('Please enter your name');
                setLoading(false);
                return;
            }
            result = await register(name, email, password);
        }

        setLoading(false);
        if (result.success) {
            // Redirect based on user role
            const savedUser = JSON.parse(localStorage.getItem('user'));
            if (savedUser?.role === 'admin' || savedUser?.role === 'manager') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
                        <Utensils size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">MessMaster</h1>
                    <p className="text-white/80">Smart Meal Management System</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-gray-600 text-sm font-semibold mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input pl-4"
                                        placeholder="John Doe"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-12"
                                    placeholder="student@college.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-600 text-sm font-semibold mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-12"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium animate-shake text-center border border-red-100 italic">
                                ⚠ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full text-lg py-4"
                            style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                        >
                            {loading ? (
                                <span className="animate-pulse">Logging in...</span>
                            ) : (
                                <>
                                    {isLogin ? 'Login' : 'Sign Up'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleFormChange}
                            className="text-gray-500 text-sm hover:text-red-500 transition-colors"
                        >
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span className="font-semibold text-red-500">
                                {isLogin ? 'Sign Up' : 'Login'}
                            </span>
                        </button>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 text-center mb-2">Demo Credentials</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => { setEmail('student@test.com'); setPassword('123456'); }}
                                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                            >
                                Student
                            </button>
                            <button
                                onClick={() => { setEmail('admin@test.com'); setPassword('123456'); setError(''); }}
                                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                            >
                                Admin
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-white/60 text-sm mt-6">
                    Reducing food waste, one meal at a time 🌱
                </p>
            </div>
        </div>
    );
}
