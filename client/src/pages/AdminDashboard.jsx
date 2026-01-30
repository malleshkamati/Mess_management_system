import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3, Users, ChefHat, TrendingUp, LogOut, AlertCircle,
    Plus, Edit2, Trash2, Download, Settings, Calendar, Clock, Star, MessageSquare, Vote, X, Info
} from 'lucide-react';
import Footer from '../components/Footer';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState([]);
    const [weeklyStats, setWeeklyStats] = useState({ weeklyData: [], totalStudents: 0 }); // Updated initial state
    const [weeklyPage, setWeeklyPage] = useState(1);
    const [wastageData, setWastageData] = useState([]);
    const [users, setUsers] = useState([]);
    const [meals, setMeals] = useState([]);
    const [mealsPage, setMealsPage] = useState(1);
    const [mealsTotal, setMealsTotal] = useState(0);
    const [mealsLimit, setMealsLimit] = useState(10);
    const [mealsSearch, setMealsSearch] = useState('');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [showMealForm, setShowMealForm] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [debouncedMealsSearch, setDebouncedMealsSearch] = useState('');
    const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersLimit, setUsersLimit] = useState(10);
    const [feedbackData, setFeedbackData] = useState([]);
    const [polls, setPolls] = useState([]);
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollStartTime, setPollStartTime] = useState('');
    const [pollEndTime, setPollEndTime] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollSubmitting, setPollSubmitting] = useState(false);
    const [showTimingSettings, setShowTimingSettings] = useState(false);
    const [wastageFormData, setWastageFormData] = useState(null); // { date, dayData: [{id, type, wastage}...] }
    const [showWeeklyMenuForm, setShowWeeklyMenuForm] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'settings') fetchPolls();
        if (activeTab === 'feedback') fetchFeedback();
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedMealsSearch(mealsSearch), 500);
        return () => clearTimeout(timer);
    }, [mealsSearch]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedUserSearch(userSearch), 500);
        return () => clearTimeout(timer);
    }, [userSearch]);

    useEffect(() => {
        fetchMeals();
    }, [mealsPage, debouncedMealsSearch, mealsLimit]);

    useEffect(() => {
        setUsersPage(1); // Reset to page 1 on search
        fetchUsers();
    }, [debouncedUserSearch, usersLimit]);

    useEffect(() => {
        fetchUsers();
    }, [usersPage]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [demandRes, weeklyRes, wastageRes, settingsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/admin/demand`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/weekly-stats`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/wastage`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, { headers })
            ]);

            if (demandRes.ok) setStats(await demandRes.json());
            if (weeklyRes.ok) setWeeklyStats(await weeklyRes.json());
            if (wastageRes.ok) setWastageData(await wastageRes.json());
            if (settingsRes.ok) setSettings(await settingsRes.json());

            await Promise.all([fetchMeals(), fetchUsers()]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedback = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/feedback`, { headers });
            if (res.ok) setFeedbackData(await res.json());
        } catch (err) {
            console.error('Error fetching feedback:', err);
        }
    };

    const fetchPolls = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/polls`, { headers });
            if (res.ok) setPolls(await res.json());
        } catch (err) {
            console.error('Error fetching polls:', err);
        }
    };

    const createPoll = async () => {
        const validOptions = pollOptions.filter(o => o.trim());
        if (!pollQuestion || !pollStartTime || !pollEndTime || validOptions.length < 2) {
            alert('Please fill in all fields and add at least 2 options');
            return;
        }
        setPollSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/polls`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    question: pollQuestion,
                    startTime: pollStartTime,
                    endTime: pollEndTime,
                    options: validOptions
                })
            });
            if (res.ok) {
                await fetchPolls();
                setShowPollForm(false);
                setPollQuestion('');
                setPollStartTime('');
                setPollEndTime('');
                setPollOptions(['', '']);
            }
        } catch (err) {
            console.error('Error creating poll:', err);
        } finally {
            setPollSubmitting(false);
        }
    };

    const togglePollActive = async (id, currentStatus) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/admin/polls/${id}/toggle`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ isActive: !currentStatus })
            });
            fetchPolls();
        } catch (err) {
            console.error('Error toggling poll:', err);
        }
    };

    const deletePoll = async (id) => {
        if (!confirm('Delete this poll?')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/admin/polls/${id}`, {
                method: 'DELETE',
                headers
            });
            fetchPolls();
        } catch (err) {
            console.error('Error deleting poll:', err);
        }
    };

    const saveWastage = async () => {
        if (!wastageFormData) return;
        try {
            // Find the meal ID for the selected date and type
            const meal = wastageData.find(w =>
                w.date && w.date.toString().startsWith(wastageFormData.date) &&
                w.type === wastageFormData.type
            );

            if (!meal) {
                alert(`No meal found for ${wastageFormData.date} (${wastageFormData.type}). Please ensure the meal is created in the menu first.`);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/wastage/${meal.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    actualWastage: wastageFormData.wastage === '' ? null : parseInt(wastageFormData.wastage),
                    wastageKg: wastageFormData.wastageKg === '' ? null : parseFloat(wastageFormData.wastageKg),
                    remarks: wastageFormData.remarks,
                    preparedCount: wastageFormData.preparedCount === '' ? null : parseInt(wastageFormData.preparedCount)
                })
            });

            if (res.ok) {
                setWastageFormData(null);
                fetchData(); // Refresh wastage data
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save wastage');
            }
        } catch (err) {
            console.error('Error saving wastage:', err);
            alert('Error saving wastage');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users?page=${usersPage}&limit=${usersLimit}&search=${debouncedUserSearch}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setUsersTotal(data.total);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchMeals = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/meals?page=${mealsPage}&limit=${mealsLimit}&search=${debouncedMealsSearch}`,
                { headers }
            );
            if (res.ok) {
                const data = await res.json();
                setMeals(data.meals);
                setMealsTotal(data.total);
            }
        } catch (err) {
            console.error('Error fetching meals:', err);
        }
    };

    const getMealIcon = (type) => ({ breakfast: '🌅', lunch: '☀️', dinner: '🌙' }[type] || '🍽️');

    const getWastageColor = (percent) => {
        if (percent === null || percent === undefined) return { hue: 0, color: '#e5e7eb', label: 'N/A' };
        if (percent <= 5) return { hue: 145, color: '#059669', label: '0-5%' };   // Deep Green
        if (percent <= 15) return { hue: 80, color: '#84cc16', label: '5-15%' };  // Lime
        if (percent <= 30) return { hue: 45, color: '#f59e0b', label: '15-30%' }; // Amber
        if (percent <= 50) return { hue: 25, color: '#f97316', label: '30-50%' }; // Orange
        return { hue: 0, color: '#ef4444', label: '50%+' };                     // Red
    };

    const getMonthlyStats = () => {
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthFiles = wastageData.filter(w => w.date.startsWith(currentMonthPrefix) && w.hasActualWastage);

        if (monthFiles.length === 0) return null;

        const totalWastageKg = monthFiles.reduce((sum, w) => sum + (w.wastageKg || 0), 0);
        const avgEfficiency = Math.round(monthFiles.reduce((sum, w) => sum + (100 - w.wastagePercent), 0) / monthFiles.length);

        const typeStats = monthFiles.reduce((acc, w) => {
            if (!acc[w.type]) acc[w.type] = 0;
            acc[w.type] += (w.wastageKg || 0);
            return acc;
        }, {});

        const mostWasteful = Object.entries(typeStats).sort((a, b) => b[1] - a[1])[0];

        const dailyWastage = monthFiles.reduce((acc, w) => {
            if (!acc[w.date]) acc[w.date] = 0;
            acc[w.date] += (w.wastageKg || 0);
            return acc;
        }, {});

        const topDays = Object.entries(dailyWastage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([date, amount]) => ({ date, amount: amount.toFixed(1) }));

        return {
            totalWastageKg: totalWastageKg.toFixed(1),
            efficiency: avgEfficiency,
            mostWasteful: mostWasteful ? { type: mostWasteful[0], amount: mostWasteful[1].toFixed(1) } : null,
            count: monthFiles.length,
            topDays
        };
    };

    const monthlyStats = getMonthlyStats();

    const handleExport = () => {
        const token = localStorage.getItem('token');
        window.open(`${import.meta.env.VITE_API_URL}/admin/export?token=` + token, '_blank');
    };

    const handleCreateMeal = async (formData) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/meals`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchData();
                setShowMealForm(false);
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateWeeklyMenu = async (meals) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/meals/bulk`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ meals })
            });
            if (res.ok) {
                fetchData();
                setShowWeeklyMenuForm(false);
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateMeal = async (id, formData) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/meals/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchData();
                setEditingMeal(null);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteMeal = async (id) => {
        if (!confirm('Are you sure you want to delete this meal?')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/admin/meals/${id}`, { method: 'DELETE', headers });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const registeredStudents = stats.length > 0 ? stats[0].totalStudents : 0;
    const totalStudents = stats.reduce((sum, s) => sum + s.studentCount, 0);
    const totalGuests = stats.reduce((sum, s) => sum + s.guestCount, 0);
    // const totalAbsent = stats.reduce((sum, s) => sum + (s.absentCount || 0), 0);
    const totalAbsent = stats.absentCount || 0;
    const totalPrep = stats.reduce((sum, s) => sum + s.recommendedPrep, 0);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'meals', label: 'Meals', icon: ChefHat },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
        { id: 'settings', label: 'Polls', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
            <div className="flex-grow">
                {/* Header (Tabs only) */}
                <header className="bg-white shadow-sm sticky top-16 z-20">
                    {/* Tabs */}
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex gap-1 border-b border-gray-200">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 py-6">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                <div className="card p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Users size={20} className="text-indigo-600" />
                                        </div>
                                        <span className="text-sm text-gray-500">Total Students</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{registeredStudents}</p>
                                </div>
                                <div className="card p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Users size={20} className="text-blue-600" />
                                        </div>
                                        <span className="text-sm text-gray-500">Students Today(marked)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{totalStudents}</p>
                                </div>
                                <div className="card p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Users size={20} className="text-purple-600" />
                                        </div>
                                        <span className="text-sm text-gray-500">Guests Today(marked)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{totalGuests}</p>
                                </div>
                                <div className="card p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                            <LogOut size={20} className="text-red-600" />
                                        </div>
                                        <span className="text-sm text-gray-500">Absent Today(marked)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{totalAbsent}</p>
                                </div>
                                <div className="card p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp size={20} className="text-green-600" />
                                        </div>
                                        <div className="flex items-center gap-2 group relative">
                                            <span className="text-sm text-gray-500">Total Prep (predicted)</span>

                                            <Info size={14} className="text-gray-400 cursor-help" />
                                            {/* Tooltip */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                                <div className="font-bold mb-1 text-gray-300">Prediction Formula</div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Students Going</span>
                                                        <span className="text-green-400">+</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Guests</span>
                                                        <span className="text-green-400">+</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Buffer (10% + 1)</span>
                                                        <span className="text-green-400">+</span>
                                                    </div>
                                                    <div className="h-px bg-gray-700 my-1"></div>
                                                    <div className="flex justify-between font-bold">
                                                        <span>Total Prep</span>
                                                        <span className="text-blue-300">=</span>
                                                    </div>
                                                    <div className="mt-2 text-[10px] text-gray-400 italic leading-tight">
                                                        *Calculated based on marked attendance and guest registration.
                                                    </div>
                                                </div>
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{totalPrep}</p>
                                </div>
                            </div>

                            {/* Wastage Heatmap */}
                            <div className="card p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <TrendingUp size={22} className="text-green-500" />
                                        Wastage Intelligence (Monthly Calendar)
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-wrap items-center gap-3 bg-gray-50/80 p-1.5 px-3 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wastage Scale:</span>
                                            {[
                                                { range: '0-5%', hue: 145 },
                                                { range: '5-15%', hue: 80 },
                                                { range: '15-30%', hue: 45 },
                                                { range: '30-50%', hue: 25 },
                                                { range: '50%+', hue: 0 }
                                            ].map(item => (
                                                <div key={item.range} className="flex items-center gap-1.5">
                                                    <div
                                                        className="w-3 h-3 rounded-sm shadow-sm"
                                                        style={{ background: `linear-gradient(135deg, hsl(${item.hue}, 70%, 55%) 0%, hsl(${item.hue}, 60%, 45%) 100%)` }}
                                                    ></div>
                                                    <span className="text-[10px] font-bold text-gray-600">{item.range}</span>
                                                </div>
                                            ))}
                                            <div className="h-3 w-px bg-gray-200 mx-1"></div>
                                            <div className="flex items-center gap-1.5 opacity-70">
                                                <div className="w-3 h-3 rounded-sm border border-dashed border-gray-400 bg-gray-100"></div>
                                                <span className="text-[10px] font-bold text-gray-600">Pending</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const today = new Date().toLocaleDateString('sv');
                                                setWastageFormData({
                                                    date: today,
                                                    type: 'lunch',
                                                    wastage: '',
                                                    wastageKg: '',
                                                    remarks: ''
                                                });
                                            }}
                                            className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            Record Wastage
                                        </button>
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left: Calendar */}
                                    <div className="lg:col-span-7 xl:col-span-8">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 mt-2">
                                            {/* Month Title */}
                                            <div className="text-center mb-3">
                                                <h3 className="text-base font-bold text-gray-700">
                                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </h3>
                                            </div>

                                            {/* Calendar Header */}
                                            <div className="grid grid-cols-7 gap-1.5 mb-2">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                    <div key={i} className="text-center text-[10px] font-semibold text-gray-500">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {(() => {
                                                    const now = new Date();
                                                    const year = now.getFullYear();
                                                    const month = now.getMonth();
                                                    const firstDay = new Date(year, month, 1).getDay();
                                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                    const today = now.getDate();

                                                    const grid = [];

                                                    // Padding for previous month
                                                    for (let i = 0; i < firstDay; i++) {
                                                        grid.push(<div key={`pad-${i}`} className="aspect-square rounded-xl bg-gray-100/50"></div>);
                                                    }

                                                    // Days of current month
                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                        const dayData = wastageData.filter(w => w.date.startsWith(dateStr));
                                                        const isToday = d === today;
                                                        const hasMeals = dayData.length > 0;

                                                        grid.push(
                                                            <div
                                                                key={d}
                                                                className={`aspect-square rounded-xl p-1 flex flex-col transition-all cursor-pointer hover:scale-105 hover:shadow-lg ${isToday
                                                                    ? 'ring-2 ring-red-400 ring-offset-2 bg-white shadow-md'
                                                                    : hasMeals
                                                                        ? 'bg-white shadow-sm hover:shadow-md'
                                                                        : 'bg-gray-100/50'
                                                                    }`}
                                                                onClick={() => {
                                                                    if (dayData.length > 0) {
                                                                        const firstMeal = dayData[0];
                                                                        setWastageFormData({
                                                                            date: dateStr,
                                                                            type: firstMeal.type,
                                                                            wastage: firstMeal.actualWastage ?? '',
                                                                            wastageKg: firstMeal.wastageKg ?? '',
                                                                            remarks: firstMeal.remarks ?? '',
                                                                            preparedCount: firstMeal.preparedCount ?? ''
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <span className={`text-[10px] font-bold ml-1 ${isToday ? 'text-red-500' : 'text-gray-400'}`}>
                                                                    {d}
                                                                </span>

                                                                <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
                                                                    {['breakfast', 'lunch', 'dinner'].map(type => {
                                                                        const meal = dayData.find(m => m.type === type);
                                                                        const wastage = meal ? meal.wastagePercent : 0;

                                                                        return (
                                                                            <div
                                                                                key={type}
                                                                                className={`flex-1 rounded transition-all relative group/cell ${!meal ? 'bg-gray-100' : 'cursor-pointer'
                                                                                    } ${meal?.hasActualWastage ? 'ring-1 ring-blue-400' : 'bg-gray-200/50 border border-dashed border-gray-300'}`}
                                                                                onClick={(e) => {
                                                                                    if (meal) {
                                                                                        e.stopPropagation();
                                                                                        setWastageFormData({
                                                                                            date: dateStr,
                                                                                            type: type,
                                                                                            wastage: meal.actualWastage ?? '',
                                                                                            wastageKg: meal.wastageKg ?? '',
                                                                                            remarks: meal.remarks ?? '',
                                                                                            preparedCount: meal.preparedCount ?? ''
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                style={meal?.hasActualWastage ? {
                                                                                    background: `linear-gradient(135deg, hsl(${getWastageColor(wastage).hue}, 70%, 55%) 0%, hsl(${getWastageColor(wastage).hue}, 60%, 45%) 100%)`
                                                                                } : {}}
                                                                                title={meal ? `${type}: ${wastage}% waste` : ''}
                                                                            >
                                                                                {meal && (
                                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 bg-gray-900 text-white p-4 rounded-xl text-xs z-50 opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all shadow-2xl pointer-events-none">
                                                                                        <div className="font-bold border-b border-white/20 pb-2 mb-2 flex justify-between items-center capitalize">
                                                                                            <span className="flex items-center gap-2">
                                                                                                {type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : '🌙'}
                                                                                                {type}
                                                                                            </span>
                                                                                            <span className="text-gray-400 text-[10px]">{d} {new Date().toLocaleDateString('en-US', { month: 'short' })}</span>
                                                                                        </div>
                                                                                        <div className="space-y-1.5">
                                                                                            <div className="flex justify-between">
                                                                                                <span className="text-gray-400">Prepared:</span>
                                                                                                <span className="font-bold">{meal.estimatedPrepared} plates</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between">
                                                                                                <span className="text-gray-400">Wasted:</span>
                                                                                                <span className="font-bold text-red-300">{meal.estimatedWastage} plates ({meal.wastagePercent}%)</span>
                                                                                            </div>
                                                                                            {meal.wastageKg > 0 && (
                                                                                                <div className="flex justify-between">
                                                                                                    <span className="text-gray-400">Weight:</span>
                                                                                                    <span className="font-bold text-orange-300">{meal.wastageKg} kg</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return grid;
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Monthly Stats Panel */}
                                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-full">
                                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                                <AlertCircle size={18} className="text-blue-500" />
                                                Monthly Insights
                                            </h3>

                                            {!monthlyStats ? (
                                                <div className="text-center py-10 text-gray-400 text-sm">
                                                    No wastage data recorded this month yet.
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Total Wastage Card */}
                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                        <div className="text-sm text-gray-400 mb-1">Total Food Wasted</div>
                                                        <div className="text-3xl font-bold text-gray-800">
                                                            {monthlyStats.totalWastageKg} <span className="text-sm font-normal text-gray-400">kg</span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-2 bg-gray-50 inline-block px-2 py-1 rounded">
                                                            Across {monthlyStats.count} meals
                                                        </div>
                                                    </div>

                                                    {/* Efficiency Score */}
                                                    <div>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="text-sm font-medium text-gray-600">Efficiency Score</span>
                                                            <span className={`text-lg font-bold ${monthlyStats.efficiency >= 90 ? 'text-green-500' : monthlyStats.efficiency >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {monthlyStats.efficiency}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${monthlyStats.efficiency >= 90 ? 'bg-green-500' : monthlyStats.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${monthlyStats.efficiency}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Based on how closely preparation matched actual consumption.
                                                        </p>
                                                    </div>

                                                    {/* Most Wasteful Meal */}
                                                    {monthlyStats.mostWasteful && (
                                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                            <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Needs Attention</div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-xl border border-red-100">
                                                                    {monthlyStats.mostWasteful.type === 'breakfast' ? '🌅' : monthlyStats.mostWasteful.type === 'lunch' ? '☀️' : '🌙'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-800 capitalize">{monthlyStats.mostWasteful.type}</div>
                                                                    <div className="text-xs text-red-600 font-medium">
                                                                        {monthlyStats.mostWasteful.amount} kg wasted this month
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Top 3 High Wastage Days */}
                                                    {monthlyStats.topDays && monthlyStats.topDays.length > 0 && (
                                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Highest Wastage Days</h4>
                                                            <div className="space-y-3">
                                                                {monthlyStats.topDays.map((day, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                                {idx + 1}
                                                                            </span>
                                                                            <span className="text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                                                        </div>
                                                                        <span className="font-bold text-gray-800">{day.amount} kg</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex justify-center items-center gap-6 mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-green-500"></div>
                                        <span className="text-xs text-gray-500">Low waste</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                        <span className="text-xs text-gray-500">Medium</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-red-500"></div>
                                        <span className="text-xs text-gray-500">High waste</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded ring-2 ring-blue-400 bg-white"></div>
                                        <span className="text-xs text-gray-500">Actual data</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Attendance & Predictions Table */}
                            <div className="card overflow-hidden w-full lg:w-3/4 mx-auto lg:mx-0">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <Calendar size={22} className="text-blue-500" />
                                            Weekly Attendance & Predictions
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Projected demand based on attendance</p>
                                    </div>
                                    <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                                        Total: {weeklyStats.totalStudents || 0}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Meal</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Absent</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Going</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Total</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider text-red-500">Prep</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {weeklyStats.weeklyData && weeklyStats.weeklyData.length > 0 ? (
                                                weeklyStats.weeklyData
                                                    .slice((weeklyPage - 1) * 5, weeklyPage * 5)
                                                    .map((row, idx) => {
                                                        const date = new Date(row.date);
                                                        const isToday = new Date().toDateString() === date.toDateString();

                                                        const totalStudents = weeklyStats.totalStudents || 0;
                                                        const notEating = parseInt(row.not_eating_count) || 0;
                                                        const going = Math.max(0, totalStudents - notEating);
                                                        const guests = parseInt(row.guest_count) || 0;
                                                        const totalDemand = going + guests;
                                                        const buffer = Math.ceil(totalDemand * 0.1);
                                                        const recPrep = totalDemand + buffer;

                                                        return (
                                                            <tr key={`${row.date}-${row.type}`} className={`group hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">{getMealIcon(row.type)}</span>
                                                                        <span className="text-sm font-medium text-gray-700 capitalize">{row.type}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        {notEating}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <span className="text-sm font-bold text-gray-700">{going}</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                                                    <span className="text-sm font-bold text-gray-800">{totalDemand}</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-100">
                                                                        {recPrep}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                        No data available for the upcoming week.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {weeklyStats.weeklyData && weeklyStats.weeklyData.length > 5 && (
                                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
                                        <div className="text-sm text-gray-500">
                                            Page <span className="font-bold text-gray-700">{weeklyPage}</span> of {Math.ceil(weeklyStats.weeklyData.length / 5)}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setWeeklyPage(prev => Math.max(1, prev - 1))}
                                                disabled={weeklyPage === 1}
                                                className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setWeeklyPage(prev => Math.min(Math.ceil(weeklyStats.weeklyData.length / 5), prev + 1))}
                                                disabled={weeklyPage >= Math.ceil(weeklyStats.weeklyData.length / 5)}
                                                className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Wastage Input Modal */}
                            {wastageFormData && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setWastageFormData(null)}>
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg text-gray-800">
                                                📝 Record Wastage
                                            </h3>
                                            <button onClick={() => setWastageFormData(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                                <X size={20} className="text-gray-400" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Date Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={wastageFormData.date}
                                                    onChange={(e) => setWastageFormData({ ...wastageFormData, date: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </div>

                                            {/* Meal Type Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                                                <select
                                                    value={wastageFormData.type}
                                                    onChange={(e) => {
                                                        const newType = e.target.value;
                                                        const mealForType = wastageData.find(w =>
                                                            w.date && w.date.toString().startsWith(wastageFormData.date) &&
                                                            w.type === newType
                                                        );
                                                        setWastageFormData({
                                                            ...wastageFormData,
                                                            type: newType,
                                                            wastage: mealForType?.actualWastage ?? '',
                                                            wastageKg: mealForType?.wastageKg ?? '',
                                                            remarks: mealForType?.remarks ?? '',
                                                            preparedCount: mealForType?.preparedCount ?? ''
                                                        });
                                                    }}
                                                    className="select w-full"
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Waste in Kg */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Waste (kg)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            placeholder="0.0"
                                                            value={wastageFormData.wastageKg}
                                                            onChange={(e) => setWastageFormData({ ...wastageFormData, wastageKg: e.target.value })}
                                                            className="input w-full pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kg</span>
                                                    </div>
                                                </div>

                                                {/* Waste in Plates (Optional) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Waste (plates)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={wastageFormData.wastage}
                                                            onChange={(e) => setWastageFormData({ ...wastageFormData, wastage: e.target.value })}
                                                            className="input w-full pr-10"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">plates</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Prepared Meal Count */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Prepared Meal Count</label>
                                                <div className="relative">
                                                    {/* <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /> */}
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Total meals prepared..."
                                                        value={wastageFormData.preparedCount}
                                                        onChange={(e) => setWastageFormData({ ...wastageFormData, preparedCount: e.target.value })}
                                                        className="input w-full pl-10"
                                                    />
                                                </div>
                                            </div>

                                            {/* Remarks */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                                <textarea
                                                    placeholder="Reason for waste, etc..."
                                                    value={wastageFormData.remarks}
                                                    onChange={(e) => setWastageFormData({ ...wastageFormData, remarks: e.target.value })}
                                                    className="input w-full min-h-[80px] py-3"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setWastageFormData(null)}
                                                className="btn btn-secondary flex-1"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={saveWastage}
                                                className="btn btn-primary flex-1"
                                            >
                                                Save Wastage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Today's Meals */}
                            {/* <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <ChefHat size={20} className="text-red-500" />
                                    Today's Meal Demand
                                </h2>
                                {stats.length === 0 && (
                                    <div className="card p-8 text-center">
                                        <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No meal data available for today.</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {stats.map(meal => (
                                        <div key={meal.id} className="card overflow-hidden h-full flex flex-col">
                                            <div className="p-5 flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl">{getMealIcon(meal.type)}</span>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-gray-800 capitalize">{meal.type}</h3>
                                                            <p className="text-[10px] text-gray-400">
                                                                Time: {meal.mealTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`badge text-[10px] ${meal.confidence === 'High' ? 'badge-success' : 'badge-danger'}`}>
                                                        {meal.confidence}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                        <p className="text-lg font-bold text-gray-800">{meal.studentCount}</p>
                                                        <p className="text-[10px] text-gray-500">Students</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                        <p className="text-lg font-bold text-gray-800">{meal.guestCount}</p>
                                                        <p className="text-[10px] text-gray-500">Guests</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                        <p className="text-lg font-bold text-gray-800">{meal.buffer}</p>
                                                        <p className="text-[10px] text-gray-500">Buffer</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                                                        <p className="text-lg font-bold text-red-600">{meal.recommendedPrep}</p>
                                                        <p className="text-[10px] text-red-500 font-semibold">Prepare</p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-100 rounded-full h-2 overflow-hidden mt-auto">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min((meal.totalDemand / meal.recommendedPrep) * 100, 100)}%`,
                                                            background: 'linear-gradient(135deg, #D32F2F 0%, #FF5252 100%)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div> */}
                        </div>
                    )}

                    {/* Meals Tab */}
                    {activeTab === 'meals' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Meal Management</h2>
                                    <p className="text-sm text-gray-500">Showing {meals.length} of {mealsTotal} total meals</p>
                                </div>

                                <div className="flex flex-1 w-full md:w-auto gap-3 items-center">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 h-10 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Per Page:</span>
                                        <select
                                            value={mealsLimit}
                                            onChange={(e) => {
                                                setMealsLimit(Number(e.target.value));
                                                setMealsPage(1);
                                            }}
                                            className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer"
                                        >
                                            {[5, 10, 20, 50].map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative flex-1">
                                        <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="    Search menu items..."
                                            className="input pl-10 h-10 w-full"
                                            value={mealsSearch}
                                            onChange={(e) => {
                                                setMealsSearch(e.target.value);
                                                setMealsPage(1); // Reset to page 1 on search
                                            }}
                                        />
                                    </div>
                                    <button onClick={() => { setShowWeeklyMenuForm(true); setShowMealForm(false); }} className="btn btn-secondary whitespace-nowrap px-4 py-2 h-10 border-red-200 text-red-600 hover:bg-red-50">
                                        <Calendar size={18} /> Weekly Menu
                                    </button>
                                    <button onClick={() => { setShowMealForm(true); setShowWeeklyMenuForm(false); }} className="btn btn-primary whitespace-nowrap px-4 py-2 h-10">
                                        <Plus size={18} /> Add Meal
                                    </button>
                                </div>
                            </div>

                            {showMealForm && <MealForm onSubmit={handleCreateMeal} onCancel={() => setShowMealForm(false)} />}
                            {showWeeklyMenuForm && <WeeklyMenuForm onSubmit={handleCreateWeeklyMenu} onCancel={() => setShowWeeklyMenuForm(false)} settings={settings} />}

                            <div className="card overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Meal Time</th>
                                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cancel By</th>
                                            <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meals.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                                    No meals found matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            meals.map(meal => (
                                                <tr key={meal.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-sm font-medium text-gray-700">
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                                                {new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                            </span>
                                                            <span>{new Date(meal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm capitalize text-gray-600">
                                                        <span className="flex items-center gap-2">
                                                            {getMealIcon(meal.type)} {meal.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={meal.menuItems}>
                                                        {meal.menuItems}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-500 font-mono">{meal.mealTime || '-'}</td>
                                                    <td className="p-4 text-sm text-gray-500 font-mono">{meal.cancelCutoff || '-'}</td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setEditingMeal(meal)}
                                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit Meal"
                                                            >
                                                                {/* <Edit2 size={16} /> */}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMeal(meal.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Meal"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Page <span className="font-bold text-gray-700">{mealsPage}</span> of {Math.ceil(mealsTotal / mealsLimit)}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            disabled={mealsPage === 1}
                                            onClick={() => setMealsPage(prev => prev - 1)}
                                            className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-1 mx-2">
                                            {Array.from({ length: Math.ceil(mealsTotal / mealsLimit) }, (_, i) => i + 1).map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setMealsPage(num)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all border ${mealsPage === num
                                                        ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                                        : 'bg-white text-gray-400 hover:text-red-500 hover:border-red-200 border-gray-200'
                                                        }`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            disabled={mealsPage >= Math.ceil(mealsTotal / mealsLimit)}
                                            onClick={() => setMealsPage(prev => prev + 1)}
                                            className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {editingMeal && (
                                <MealForm
                                    meal={editingMeal}
                                    onSubmit={(data) => handleUpdateMeal(editingMeal.id, data)}
                                    onCancel={() => setEditingMeal(null)}
                                />
                            )}
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Registered Users</h2>
                                    <p className="text-sm text-gray-500">Showing {users.length} of {usersTotal} members found</p>
                                </div>
                                <div className="flex flex-1 w-full md:w-auto gap-3 items-center max-w-2xl">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 h-10 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Per Page:</span>
                                        <select
                                            value={usersLimit}
                                            onChange={(e) => {
                                                setUsersLimit(Number(e.target.value));
                                                setUsersPage(1);
                                            }}
                                            className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer"
                                        >
                                            {[5, 10, 20, 50].map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative flex-1">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email or roll number..."
                                            className="input pl-10 h-10 w-full"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="card overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Name</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Roll No</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                                            <th className="text-right p-4 text-sm font-semibold text-gray-600">Karma</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="border-t border-gray-100">
                                                <td className="p-4 text-sm font-medium">{u.name}</td>
                                                <td className="p-4 text-sm text-gray-600">{u.email}</td>
                                                <td className="p-4 text-sm">{u.rollNo || '-'}</td>
                                                <td className="p-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                        u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-yellow-600">⭐ {u.karmaPoints}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Page <span className="font-bold text-gray-700">{usersPage}</span> of {Math.ceil(usersTotal / usersLimit) || 1}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            disabled={usersPage === 1}
                                            onClick={() => setUsersPage(prev => prev - 1)}
                                            className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-1 mx-2">
                                            {Array.from({ length: Math.ceil(usersTotal / usersLimit) }, (_, i) => i + 1).map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setUsersPage(num)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all border ${usersPage === num
                                                        ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                                        : 'bg-white text-gray-400 hover:text-red-500 hover:border-red-200 border-gray-200'
                                                        }`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            disabled={usersPage >= Math.ceil(usersTotal / usersLimit)}
                                            onClick={() => setUsersPage(prev => prev + 1)}
                                            className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Collapsible Meal Timing Settings */}
                            {/* <button
                                onClick={() => setShowTimingSettings(!showTimingSettings)}
                                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Clock size={16} className="text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-800 text-sm">Meal Timing Settings</h3>
                                        <p className="text-[10px] text-gray-400">Configure meal times & cutoffs</p>
                                    </div>
                                </div>
                                <span className={`text-gray-400 transition-transform ${showTimingSettings ? 'rotate-180' : ''}`}>▼</span>
                            </button> */}

                            {/* {showTimingSettings && (
                                <div className="bg-gray-50 rounded-xl p-4 -mt-2 border border-gray-100">
                                    <div className="flex gap-3">
                                        {['breakfast', 'lunch', 'dinner'].map(type => (
                                            <div key={type} className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span>{type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : '🌙'}</span>
                                                    <span className="text-xs font-semibold text-gray-700 capitalize">{type}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 w-12">Time</span>
                                                        <input type="time" className="input py-1 px-2 text-xs flex-1" defaultValue={settings[type]?.mealTime || ''} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 w-12">Cutoff</span>
                                                        <input type="time" className="input py-1 px-2 text-xs flex-1 border-orange-200" defaultValue={settings[type]?.cancelCutoff || ''} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-3 text-center">Changes apply to newly created meals only</p>
                                </div>
                            )} */}

                            {/* Poll Management Section */}
                            <div className="mt-8 pt-8 ">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Vote size={20} className="text-purple-500" />
                                            Poll Management
                                        </h2>
                                        <p className="text-gray-500 text-sm">Create and manage polls for students to vote on.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPollForm(!showPollForm)}
                                        className="btn btn-primary flex items-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
                                    >
                                        {showPollForm ? <X size={18} /> : <Plus size={18} />}
                                        {showPollForm ? 'Cancel' : 'Create Poll'}
                                    </button>
                                </div>

                                {/* Create Poll Form */}
                                {showPollForm && (
                                    <div className="card p-5 mb-6 border-2 border-purple-200 bg-purple-50">
                                        <div className="mb-4">
                                            <label className="text-sm text-gray-600 block mb-1">Poll Question</label>
                                            <input
                                                type="text"
                                                value={pollQuestion}
                                                onChange={(e) => setPollQuestion(e.target.value)}
                                                placeholder="What would you like to ask?"
                                                className="input w-full"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">Start Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={pollStartTime}
                                                    onChange={(e) => setPollStartTime(e.target.value)}
                                                    className="input w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600 block mb-1">End Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={pollEndTime}
                                                    onChange={(e) => setPollEndTime(e.target.value)}
                                                    className="input w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-sm text-gray-600 block mb-2">Options</label>
                                            {pollOptions.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOptions = [...pollOptions];
                                                            newOptions[idx] = e.target.value;
                                                            setPollOptions(newOptions);
                                                        }}
                                                        placeholder={`Option ${idx + 1}`}
                                                        className="input flex-1"
                                                    />
                                                    {pollOptions.length > 2 && (
                                                        <button
                                                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setPollOptions([...pollOptions, ''])}
                                                className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
                                        <button
                                            onClick={createPoll}
                                            disabled={pollSubmitting}
                                            className="btn btn-primary w-full disabled:opacity-50"
                                            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
                                        >
                                            {pollSubmitting ? 'Creating...' : 'Create Poll'}
                                        </button>
                                    </div>
                                )}

                                {/* Poll List */}
                                {polls.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Vote size={40} className="mx-auto mb-2 opacity-50" />
                                        <p>No polls created yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {polls.map(poll => {
                                            const now = new Date();
                                            const start = new Date(poll.startTime);
                                            const end = new Date(poll.endTime);
                                            const isLive = poll.isActive && now >= start && now <= end;
                                            const isEnded = now > end;

                                            return (
                                                <div key={poll.id} className={`card p-4 ${isLive ? 'border-2 border-green-400' : ''}`}>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-gray-800">{poll.question}</h3>
                                                                {isLive && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">🔴 Live</span>}
                                                                {isEnded && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Ended</span>}
                                                                {!poll.isActive && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Paused</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(poll.startTime).toLocaleString()} → {new Date(poll.endTime).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => togglePollActive(poll.id, poll.isActive)}
                                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${poll.isActive ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                                                            >
                                                                {poll.isActive ? 'Pause' : 'Activate'}
                                                            </button>
                                                            <button
                                                                onClick={() => deletePoll(poll.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {poll.options.map(opt => {
                                                            const percent = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
                                                            return (
                                                                <div key={opt.id} className="relative">
                                                                    <div
                                                                        className="absolute h-full bg-purple-100 rounded-lg transition-all"
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                    <div className="relative flex justify-between items-center p-2 rounded-lg">
                                                                        <span className="text-sm text-gray-700">{opt.optionText}</span>
                                                                        <span className="text-xs font-medium text-purple-600">{opt.voteCount} votes ({percent}%)</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-400">
                                                        Total votes: {poll.totalVotes}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback Tab */}
                    {activeTab === 'feedback' && (
                        <FeedbackAnalytics feedbackData={feedbackData} onRefresh={fetchFeedback} />
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}

// Feedback Analytics Component
function FeedbackAnalytics({ feedbackData, onRefresh }) {
    // Pie Chart filters (independent)
    const [chartTimeFilter, setChartTimeFilter] = useState('week');
    const [chartMealFilter, setChartMealFilter] = useState('all');
    const [chartCustomStart, setChartCustomStart] = useState('');
    const [chartCustomEnd, setChartCustomEnd] = useState('');

    // Recent Feedback filters (independent)
    const [listTimeFilter, setListTimeFilter] = useState('week');
    const [listMealFilter, setListMealFilter] = useState('all');
    const [listCustomStart, setListCustomStart] = useState('');
    const [listCustomEnd, setListCustomEnd] = useState('');
    const [feedbackPage, setFeedbackPage] = useState(1);
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const feedbackPerPage = 5;

    useEffect(() => {
        // fetchFeedback is now handled by the parent effect on tab switch
    }, []);

    // Reset list page when list filters change
    useEffect(() => {
        setFeedbackPage(1);
    }, [listTimeFilter, listMealFilter, listCustomStart, listCustomEnd, feedbackSearch]);

    // Filter helper function
    const filterByTimeAndMeal = (data, timeFilter, mealFilter, customStart, customEnd) => {
        const now = new Date();
        return data.filter(f => {
            // Meal type filter
            if (mealFilter !== 'all' && f.type !== mealFilter) {
                return false;
            }
            // Time filter
            const feedbackDate = new Date(f.date);
            if (timeFilter === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return feedbackDate >= weekAgo;
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return feedbackDate >= monthAgo;
            } else if (timeFilter === 'custom' && customStart && customEnd) {
                const start = new Date(customStart);
                const end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
                return feedbackDate >= start && feedbackDate <= end;
            }
            return true;
        });
    };

    // Pie chart filtered data
    const chartFilteredData = filterByTimeAndMeal(feedbackData, chartTimeFilter, chartMealFilter, chartCustomStart, chartCustomEnd);

    // Recent feedback filtered data (includes search)
    const getListFilteredData = () => {
        const baseFiltered = filterByTimeAndMeal(feedbackData, listTimeFilter, listMealFilter, listCustomStart, listCustomEnd);
        if (!feedbackSearch) return baseFiltered;
        const searchLower = feedbackSearch.toLowerCase();
        return baseFiltered.filter(f =>
            f.userName?.toLowerCase().includes(searchLower) ||
            f.remarks?.toLowerCase().includes(searchLower) ||
            f.menuItems?.toLowerCase().includes(searchLower)
        );
    };
    const listFilteredData = getListFilteredData();

    // Calculate analytics from chart filtered data
    const avgRating = chartFilteredData.length > 0
        ? (chartFilteredData.reduce((sum, f) => sum + f.rating, 0) / chartFilteredData.length).toFixed(1)
        : 0;

    const ratingCounts = [1, 2, 3, 4, 5].map(r => chartFilteredData.filter(f => f.rating === r).length);
    const total = ratingCounts.reduce((a, b) => a + b, 0);

    const chartColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    return (
        <div className="space-y-6">
            {/* Pie Chart Card */}
            <div className="card p-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Rating Distribution</h2>
                        <p className="text-sm text-gray-500">{chartFilteredData.length} reviews</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={chartMealFilter}
                            onChange={(e) => setChartMealFilter(e.target.value)}
                            className="input text-sm py-1 px-3"
                        >
                            <option value="all">All Meals</option>
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                        <select
                            value={chartTimeFilter}
                            onChange={(e) => setChartTimeFilter(e.target.value)}
                            className="input text-sm py-1 px-3"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        <button onClick={onRefresh} className="btn btn-secondary text-sm py-1 px-3">
                            ↻
                        </button>
                    </div>
                </div>

                {/* Chart Custom Date Range */}
                {chartTimeFilter === 'custom' && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500">From:</label>
                            <input
                                type="date"
                                value={chartCustomStart}
                                onChange={(e) => setChartCustomStart(e.target.value)}
                                className="input text-sm py-1 px-2"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500">To:</label>
                            <input
                                type="date"
                                value={chartCustomEnd}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setChartCustomEnd(e.target.value)}
                                className="input text-sm py-1 px-2"
                            />
                        </div>
                    </div>
                )}

                {chartFilteredData.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No feedback for selected filters</p>
                ) : (
                    <div className="flex items-center gap-8">
                        {/* Pie Chart */}
                        <div
                            className="w-32 h-32 rounded-full relative flex-shrink-0"
                            style={{
                                background: (() => {
                                    if (total === 0) return '#e5e7eb';
                                    let cumulative = 0;
                                    const segments = ratingCounts.map((count, i) => {
                                        const start = cumulative;
                                        cumulative += (count / total) * 100;
                                        return `${chartColors[i]} ${start}% ${cumulative}%`;
                                    });
                                    return `conic-gradient(${segments.join(', ')})`;
                                })()
                            }}
                        >
                            <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-xl font-black text-gray-800">{avgRating}</div>
                                    <div className="text-xs text-gray-400">avg</div>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="space-y-1">
                            {[5, 4, 3, 2, 1].map((star, i) => {
                                const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
                                return (
                                    <div key={star} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                                        <div className="flex items-center gap-1">
                                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-medium">{star}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">({ratingCounts[star - 1]})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Feedback Card */}
            <div className="card p-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Recent Feedback</h2>
                        <p className="text-sm text-gray-500">{listFilteredData.length} reviews</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={feedbackSearch}
                            onChange={(e) => setFeedbackSearch(e.target.value)}
                            className="input text-sm py-1 px-3 w-36"
                        />
                        <select
                            value={listMealFilter}
                            onChange={(e) => setListMealFilter(e.target.value)}
                            className="input text-sm py-1 px-3"
                        >
                            <option value="all">All Meals</option>
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                        <select
                            value={listTimeFilter}
                            onChange={(e) => setListTimeFilter(e.target.value)}
                            className="input text-sm py-1 px-3"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                </div>

                {/* List Custom Date Range */}
                {listTimeFilter === 'custom' && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500">From:</label>
                            <input
                                type="date"
                                value={listCustomStart}
                                onChange={(e) => setListCustomStart(e.target.value)}
                                className="input text-sm py-1 px-2"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500">To:</label>
                            <input
                                type="date"
                                value={listCustomEnd}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setListCustomEnd(e.target.value)}
                                className="input text-sm py-1 px-2"
                            />
                        </div>
                    </div>
                )}

                {listFilteredData.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No feedback for selected filters</p>
                ) : (
                    <>
                        <div className="space-y-3">
                            {listFilteredData
                                .slice((feedbackPage - 1) * feedbackPerPage, feedbackPage * feedbackPerPage)
                                .map((f, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-sm">
                                                <span className={`font-semibold ${f.isAnonymous ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                                                    {f.isAnonymous ? '🕵️ Anonymous' : f.userName}
                                                </span>
                                                <span className="text-gray-400 mx-1">•</span>
                                                <span className="capitalize text-gray-500">{f.type}</span>
                                                <span className="text-gray-400 mx-1">•</span>
                                                <span className="text-gray-400 text-xs">
                                                    {new Date(f.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, idx) => (
                                                    <Star
                                                        key={idx}
                                                        size={12}
                                                        className={idx < f.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {f.menuItems && (
                                            <div className="text-xs text-gray-500 mb-1">🍽️ {f.menuItems}</div>
                                        )}
                                        {f.remarks && (
                                            <p className="text-sm text-gray-600 italic">"{f.remarks}"</p>
                                        )}
                                    </div>
                                ))}
                        </div>

                        {/* Pagination */}
                        {listFilteredData.length > feedbackPerPage && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                <span className="text-sm text-gray-500">
                                    Page {feedbackPage} of {Math.ceil(listFilteredData.length / feedbackPerPage)}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFeedbackPage(p => Math.max(1, p - 1))}
                                        disabled={feedbackPage === 1}
                                        className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setFeedbackPage(p => Math.min(Math.ceil(listFilteredData.length / feedbackPerPage), p + 1))}
                                        disabled={feedbackPage >= Math.ceil(listFilteredData.length / feedbackPerPage)}
                                        className="btn btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Meal Form Component
function MealForm({ meal, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        date: meal?.date || new Date().toISOString().split('T')[0],
        type: meal?.type || 'lunch',
        menuItems: meal?.menuItems || '',
        mealTime: meal?.mealTime || '12:30',
        cancelCutoff: meal?.cancelCutoff || '11:00',
        isGreenDay: meal?.isGreenDay || false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="card p-5 border-2 border-red-200 bg-red-50/30">
            <h3 className="font-bold text-lg mb-4">{meal ? 'Edit Meal' : 'Add New Meal'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-gray-600 font-medium">Date</label>
                    <input
                        type="date"
                        className="input mt-1"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        disabled={!!meal}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-600 font-medium">Meal Type</label>
                    <select
                        className="input mt-1"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        disabled={!!meal}
                    >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium">Menu Items</label>
                    <input
                        type="text"
                        className="input mt-1"
                        placeholder="Rice, Dal, Vegetables..."
                        value={formData.menuItems}
                        onChange={e => setFormData({ ...formData, menuItems: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-600 font-medium">Meal Time</label>
                    <input
                        type="time"
                        className="input mt-1"
                        value={formData.mealTime}
                        onChange={e => setFormData({ ...formData, mealTime: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-600 font-medium">Cancel Cutoff</label>
                    <input
                        type="time"
                        className="input mt-1"
                        value={formData.cancelCutoff}
                        onChange={e => setFormData({ ...formData, cancelCutoff: e.target.value })}
                    />
                </div>
                <div className="col-span-2 flex gap-3 mt-2">
                    <button type="submit" className="btn btn-primary">
                        {meal ? 'Update Meal' : 'Create Meal'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

// Weekly Menu Form Component
function WeeklyMenuForm({ onSubmit, onCancel, settings }) {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [weekData, setWeekData] = useState(
        Array.from({ length: 7 }, (_, i) => ({
            breakfast: '',
            lunch: '',
            dinner: ''
        }))
    );

    const handleInputChange = (dayIdx, type, value) => {
        const newData = [...weekData];
        newData[dayIdx][type] = value;
        setWeekData(newData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const meals = [];
        const start = new Date(startDate);

        weekData.forEach((day, i) => {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            ['breakfast', 'lunch', 'dinner'].forEach(type => {
                if (day[type].trim()) {
                    meals.push({
                        date: dateStr,
                        type,
                        menuItems: day[type],
                        mealTime: settings[type]?.mealTime || (type === 'breakfast' ? '08:00' : type === 'lunch' ? '12:30' : '19:30'),
                        cancelCutoff: settings[type]?.cancelCutoff || (type === 'breakfast' ? '07:00' : type === 'lunch' ? '11:00' : '18:00'),
                        isGreenDay: false
                    });
                }
            });
        });

        if (meals.length === 0) {
            alert('Please enter at least one meal menu.');
            return;
        }

        onSubmit(meals);
    };

    return (
        <div className="card p-6 border-2 border-orange-200 bg-orange-50/30">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-xl text-gray-800">Add Weekly Menu</h3>
                    <p className="text-sm text-gray-500">Fill in the menu for the entire week starting from your chosen date.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                    <label className="text-xs font-bold text-gray-400 uppercase">Start Date</label>
                    <input
                        type="date"
                        className="border-none focus:ring-0 text-sm font-semibold text-gray-700"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="text-left border-b border-orange-100">
                                <th className="pb-3 text-xs font-bold text-gray-400 uppercase w-32">Day</th>
                                <th className="pb-3 text-xs font-bold text-gray-400 uppercase">🌅 Breakfast</th>
                                <th className="pb-3 text-xs font-bold text-gray-400 uppercase">☀️ Lunch</th>
                                <th className="pb-3 text-xs font-bold text-gray-400 uppercase">🌙 Dinner</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50">
                            {weekData.map((day, i) => {
                                const date = new Date(startDate);
                                date.setDate(date.getDate() + i);
                                return (
                                    <tr key={i} className="group hover:bg-white/50 transition-colors">
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-orange-400 uppercase">
                                                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                                                </span>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="text"
                                                className="input w-full py-1.5 px-3 text-sm focus:border-orange-300"
                                                placeholder="Menu items..."
                                                value={day.breakfast}
                                                onChange={e => handleInputChange(i, 'breakfast', e.target.value)}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="text"
                                                className="input w-full py-1.5 px-3 text-sm focus:border-orange-300"
                                                placeholder="Menu items..."
                                                value={day.lunch}
                                                onChange={e => handleInputChange(i, 'lunch', e.target.value)}
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <input
                                                type="text"
                                                className="input w-full py-1.5 px-3 text-sm focus:border-orange-300"
                                                placeholder="Menu items..."
                                                value={day.dinner}
                                                onChange={e => handleInputChange(i, 'dinner', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-orange-100">
                    <button type="submit" className="btn btn-primary px-8" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
                        Save Weekly Menu
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-secondary px-8">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
