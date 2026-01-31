import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, LogOut, LayoutDashboard, Settings, User as UserIcon, ChefHat } from 'lucide-react';
import logo from '../assets/mess_master_logo.png';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const isAdmin = user.role === 'admin' || user.role === 'manager';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4 md:px-8">
            {/* Logo & Brand */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 border border-red-50">
                    <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent hidden sm:block">
                    MessMaster
                </span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2 md:gap-6">
                {!isAdmin && (
                    <div className="hidden md:flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-100">
                        <span className="opacity-70 mr-2">Karma:</span> {user.karmaPoints || 0}
                    </div>
                )}

                {/* <button
                    onClick={() => navigate(isAdmin ? '/admin' : '/')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${(location.pathname === '/' || location.pathname === '/admin')
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                >
                    <LayoutDashboard size={18} />
                    <span className="hidden md:block">Dashboard</span>
                </button> */}

                <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>

                {/* User Profile / Logout */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-bold text-gray-900 leading-none">{user.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-1">{user.role}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
