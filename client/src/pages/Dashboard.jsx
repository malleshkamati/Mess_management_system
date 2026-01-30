import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Leaf, Users, Calendar, LogOut, ChefHat, User,
    X, ChevronLeft, ChevronRight, Check, Star, MessageSquare, Vote, AlertCircle
} from 'lucide-react';
import Footer from '../components/Footer';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [allMeals, setAllMeals] = useState([]);
    const [karma, setKarma] = useState(user?.karmaPoints || 0);
    const [loading, setLoading] = useState(true);
    const [impact, setImpact] = useState({ foodSavedKg: 0, mealsSaved: 0 });
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [karmaPop, setKarmaPop] = useState(null); // { points: number, id: Date.now() }
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Feedback states
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackDate, setFeedbackDate] = useState('');
    const [feedbackMeals, setFeedbackMeals] = useState([]);
    const [selectedFeedbackMeal, setSelectedFeedbackMeal] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackRemarks, setFeedbackRemarks] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [feedbackToast, setFeedbackToast] = useState(null); // { type: 'success'|'error', message: string }
    const [activePolls, setActivePolls] = useState([]);
    const [pollVoting, setPollVoting] = useState(null);

    useEffect(() => {
        fetchMeals();
        fetchImpact();
        fetchActivePolls();
    }, []);

    const triggerKarmaPop = (points) => {
        if (!points) return;
        const id = Date.now();
        setKarmaPop({ points, id });
        setTimeout(() => setKarmaPop(null), 2000);
    };

    const fetchMeals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/meals/upcoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllMeals(data);
            }
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchImpact = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/meals/impact`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setImpact(data);
            }
        } catch (error) {
            console.error('Error fetching impact:', error);
        }
    };

    const fetchActivePolls = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/polls/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setActivePolls(await res.json());
            }
        } catch (error) {
            console.error('Error fetching polls:', error);
        }
    };

    const submitVote = async (pollId, optionId) => {
        setPollVoting(pollId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/polls/${pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ optionId })
            });
            if (res.ok) {
                // Update local state to show voted
                setActivePolls(activePolls.map(p =>
                    p.id === pollId
                        ? { ...p, userVote: optionId, options: p.options.map(o => o.id === optionId ? { ...o, voteCount: parseInt(o.voteCount) + 1 } : o) }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setPollVoting(null);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'going' ? 'not_eating' : 'going';
        const oldMeals = [...allMeals];
        setAllMeals(allMeals.map(m => m.id === id ? { ...m, userStatus: newStatus, processing: true } : m));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/meals/${id}/intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                setMeals(oldMeals);
                alert('Failed to update status');
            } else {
                const data = await res.json();
                setAllMeals(prev => prev.map(m => m.id === id ? {
                    ...m,
                    userStatus: newStatus,
                    isKarmaClaimed: data.isKarmaClaimed ?? m.isKarmaClaimed,
                    processing: false
                } : m));
                if (data.karma) setKarma(data.karma);
                if (data.gained) triggerKarmaPop(data.gained);
                fetchImpact(); // Refresh impact after status change
            }
        } catch (error) {
            setAllMeals(oldMeals);
        }
    };

    const toggleGuest = async (id, currentGuestCount) => {
        const newCount = (currentGuestCount || 0) >= 3 ? 0 : (currentGuestCount || 0) + 1;
        const oldMeals = [...allMeals];
        setAllMeals(allMeals.map(m => m.id === id ? { ...m, guestCount: newCount, processing: true } : m));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/meals/${id}/guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ guestCount: newCount })
            });

            if (!res.ok) {
                setMeals(oldMeals);
                alert('Failed to update guest count');
            } else {
                const data = await res.json();
                setAllMeals(prev => prev.map(m => m.id === id ? {
                    ...m,
                    guestCount: newCount,
                    isKarmaClaimed: data.isKarmaClaimed ?? m.isKarmaClaimed,
                    processing: false
                } : m));
                if (data.karma) setKarma(data.karma);
                if (data.gained) triggerKarmaPop(data.gained);
            }
        } catch (error) {
            setAllMeals(oldMeals);
        }
    };

    const applyBreak = async (startDate, endDate, reason) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/breaks/long-break`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ startDate, endDate, skipReason: reason || 'Vacation' })
            });
            const data = await res.json();
            if (res.ok) {
                // Success handled in Modal
                fetchMeals();
                fetchImpact();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to apply break' };
        }
    };

    // Fetch meals for feedback form
    const fetchMealsForFeedback = async (date) => {
        if (!date) return;
        setFeedbackLoading(true);
        setSelectedFeedbackMeal(null);
        setFeedbackRating(0);
        setFeedbackRemarks('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/feedback/meals/${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackMeals(data);
            }
        } catch (error) {
            console.error('Error fetching meals for feedback:', error);
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Show toast helper
    const showFeedbackToast = (type, message) => {
        setFeedbackToast({ type, message });
        setTimeout(() => setFeedbackToast(null), 3000);
    };

    // Submit feedback
    const submitFeedback = async () => {
        if (!selectedFeedbackMeal) {
            showFeedbackToast('error', 'Please select a meal');
            return;
        }
        if (!feedbackRating) {
            showFeedbackToast('error', 'Please select a rating');
            return;
        }
        setFeedbackSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    mealId: selectedFeedbackMeal.id,
                    rating: feedbackRating,
                    remarks: feedbackRemarks || null,
                    isAnonymous: isAnonymous
                })
            });
            if (res.ok) {
                showFeedbackToast('success', 'Thank you for your feedback! 🎉');
                // Clear form
                setSelectedFeedbackMeal(null);
                setFeedbackRating(0);
                setFeedbackRemarks('');
                setIsAnonymous(false);
            } else {
                const data = await res.json();
                showFeedbackToast('error', data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showFeedbackToast('error', 'Failed to submit feedback');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const getMealTime = (type) => {
        const times = {
            breakfast: '7:30 - 9:00 AM',
            lunch: '12:30 - 2:00 PM',
            dinner: '7:30 - 9:00 PM'
        };
        return times[type] || '';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your meals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-grow pb-24">
                {/* Header */}
                <header className="bg-white sticky top-0 z-20 shadow-sm">
                    <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                Hi, {user?.name || 'Student'} 👋
                            </h1>
                            <p className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="badge badge-karma animate-pulse-subtle">
                                <Leaf size={14} />
                                <span>{karma} Karma</span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                    {/* Impact Banner */}
                    <div
                        className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden animate-fade-in"
                        style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🌍</span>
                                <h3 className="font-bold text-lg">Your Impact</h3>
                            </div>
                            <p className="text-white/90">
                                You saved <span className="font-bold text-2xl">{impact.foodSavedKg} kg</span> of food so far!
                            </p>
                            <p className="text-sm text-white/70 mt-1">That's approximately {impact.mealsSaved} meals saved</p>
                        </div>
                        <Leaf className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32" />
                    </div>

                    {/* Date Navigator */}
                    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-between overflow-x-auto">
                        {Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const isToday = i === 0;
                            const isActive = selectedDate === dateStr;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold uppercase mb-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span className="text-sm font-bold">
                                        {date.getDate()}
                                    </span>
                                    {isToday && !isActive && (
                                        <div className="w-1 h-1 bg-red-500 rounded-full mt-1"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today's Meals */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ChefHat size={20} className="text-red-500" />
                                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Meals" : "Upcoming Meals"}
                            </h2>
                            <span className="text-sm text-gray-500">
                                {allMeals.filter(m => m.date.startsWith(selectedDate)).length} meals
                            </span>
                        </div>

                        {allMeals.filter(m => m.date.startsWith(selectedDate)).length === 0 && (
                            <div className="card p-8 text-center text-gray-500 bg-gray-50 border-dashed">
                                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No meals scheduled for this day.</p>
                            </div>
                        )}

                        {allMeals.filter(m => m.date.startsWith(selectedDate)).map((meal, index) => (
                            <div
                                key={meal.id}
                                className={`card overflow-hidden animate-fade-in relative status-transition ${meal.processing ? 'opacity-80' : ''} ${meal.isExpired ? 'opacity-60' : ''}`}
                                style={{
                                    animationDelay: `${index * 0.1}s`,
                                    transform: meal.userStatus === 'going' && !meal.isExpired ? 'scale(1.02)' : 'scale(1)',
                                    borderColor: meal.isExpired ? '#9CA3AF' : meal.userStatus === 'going' ? '#EF4444' : '#E5E7EB',
                                    boxShadow: meal.userStatus === 'going' && !meal.isExpired ? '0 10px 15px -3px rgba(239, 68, 68, 0.1)' : ''
                                }}
                            >
                                {/* Processing Overlay */}
                                {meal.processing && (
                                    <div className="absolute inset-0 z-10 processing-overlay flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-800 capitalize">
                                                {meal.type}
                                            </h3>
                                            <p className="text-sm text-gray-400">{getMealTime(meal.type)}</p>
                                        </div>
                                        {meal.isExpired ? (
                                            <span className="badge bg-gray-200 text-gray-500">
                                                ⏰ Expired
                                            </span>
                                        ) : (
                                            <span className={`badge status-transition ${meal.userStatus === 'going' ? 'badge-success animate-pulse-subtle' : 'badge-danger'}`}>
                                                {meal.userStatus === 'going' ? '✓ Eating' : '✗ Skipping'}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-600 mb-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                        {meal.menuItems || 'Menu not available'}
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            disabled={meal.processing || meal.isExpired}
                                            onClick={() => toggleStatus(meal.id, meal.userStatus)}
                                            className={`flex-1 btn text-sm status-transition active:scale-95 ${meal.isExpired
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                : meal.userStatus === 'going'
                                                    ? 'btn-secondary text-red-500 border-red-200 hover:bg-red-50'
                                                    : 'btn-primary'
                                                }`}
                                            style={!meal.isExpired && meal.userStatus !== 'going' ? { background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' } : {}}
                                        >
                                            {meal.isExpired ? 'Meal Ended' : meal.userStatus === 'going' ? 'Cancel Meal' : `I am going${!meal.isKarmaClaimed ? ' (+1)' : ''}`}
                                        </button>

                                        <button
                                            disabled={meal.processing || meal.isExpired}
                                            onClick={() => toggleGuest(meal.id, meal.guestCount)}
                                            className={`btn whitespace-nowrap status-transition active:scale-110 ${meal.isExpired
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                : (meal.guestCount || 0) > 0
                                                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 animate-pulse-subtle'
                                                    : 'btn-secondary'
                                                }`}
                                        >
                                            <Users size={18} className={!meal.isExpired && (meal.guestCount || 0) > 0 ? 'animate-bounce' : ''} />
                                            <span className="text-sm font-semibold ml-1">
                                                {(meal.guestCount || 0) > 0 ? `Guest: ${meal.guestCount}` : `Add Guest${!meal.isKarmaClaimed ? ' (+1)' : ''}`}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Long Break Button */}
                    <button
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="btn btn-secondary w-full py-4 text-gray-600 flex items-center justify-center gap-2"
                    >
                        <Calendar size={20} />
                        <span>Mark Long Leave / Vacation</span>
                    </button>

                    {/* Active Polls */}
                    {activePolls.length > 0 && (
                        <div className="space-y-4">
                            {activePolls.map(poll => {
                                const totalVotes = poll.options.reduce((sum, o) => sum + parseInt(o.voteCount || 0), 0);
                                const hasVoted = poll.userVote;

                                return (
                                    <div key={poll.id} className="card p-5 border-2 border-purple-200 animate-fade-in">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Vote size={20} className="text-purple-500" />
                                            <h3 className="font-bold text-gray-800">{poll.question}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">
                                            Poll ends: {new Date(poll.endTime).toLocaleString()}
                                        </p>
                                        <div className="space-y-2">
                                            {poll.options.map(opt => {
                                                const percent = totalVotes > 0 ? Math.round((parseInt(opt.voteCount) / totalVotes) * 100) : 0;
                                                const isSelected = poll.userVote === opt.id;

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => !hasVoted && submitVote(poll.id, opt.id)}
                                                        disabled={hasVoted || pollVoting === poll.id}
                                                        className={`w-full text-left relative rounded-xl overflow-hidden transition-all ${hasVoted ? 'cursor-default' : 'hover:ring-2 hover:ring-purple-300'
                                                            } ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                                                    >
                                                        <div
                                                            className={`absolute h-full transition-all ${isSelected ? 'bg-purple-200' : 'bg-gray-100'}`}
                                                            style={{ width: hasVoted ? `${percent}%` : '0%' }}
                                                        />
                                                        <div className="relative flex justify-between items-center p-3">
                                                            <span className={`text-sm ${isSelected ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                                                                {isSelected && '✓ '}{opt.optionText}
                                                            </span>
                                                            {hasVoted && (
                                                                <span className="text-xs font-medium text-purple-600">{percent}%</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {hasVoted && (
                                            <p className="text-xs text-gray-400 mt-3 text-center">
                                                You voted! Total: {totalVotes} votes
                                            </p>
                                        )}
                                        {pollVoting === poll.id && (
                                            <div className="text-center mt-3 text-purple-500 text-sm">
                                                Submitting...
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Feedback Form */}
                    {!isFeedbackOpen ? (
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className="btn btn-secondary w-full py-4 text-gray-600 flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={20} />
                            <span>Give Meal Feedback</span>
                        </button>
                    ) : (
                        <div className="card p-5 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={20} className="text-red-500" />
                                    <h2 className="font-bold text-lg text-gray-800">Give Meal Feedback</h2>
                                </div>
                                <button
                                    onClick={() => setIsFeedbackOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm text-gray-500 mb-1 block">Select Date</label>
                                <input
                                    type="date"
                                    value={feedbackDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setFeedbackDate(e.target.value);
                                        fetchMealsForFeedback(e.target.value);
                                    }}
                                    className="input w-full"
                                />
                            </div>

                            {feedbackLoading && (
                                <div className="text-center py-4 text-gray-400">
                                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    Loading meals...
                                </div>
                            )}

                            {!feedbackLoading && feedbackDate && feedbackMeals.length === 0 && (
                                <p className="text-center text-gray-400 py-4">No meals found for this date</p>
                            )}

                            {!feedbackLoading && feedbackMeals.length > 0 && (
                                <>
                                    {/* Meal Type Dropdown */}
                                    <div className="mb-4">
                                        <label className="text-sm text-gray-500 mb-1 block">Select Meal</label>
                                        <select
                                            value={selectedFeedbackMeal?.id || ''}
                                            onChange={(e) => {
                                                const meal = feedbackMeals.find(m => m.id === e.target.value);
                                                setSelectedFeedbackMeal(meal || null);
                                                setFeedbackRating(0);
                                                setFeedbackRemarks('');
                                            }}
                                            className="input w-full"
                                        >
                                            <option value="">-- Choose Meal --</option>
                                            {feedbackMeals.map(meal => (
                                                <option key={meal.id} value={meal.id}>
                                                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Show menu, rating, remarks only when a meal is selected */}
                                    {selectedFeedbackMeal && (
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 mb-3 italic bg-white p-3 rounded-lg border border-gray-100">
                                                <span className="font-semibold">Menu:</span> {selectedFeedbackMeal.menuItems || 'N/A'}
                                            </p>

                                            {/* Star Rating */}
                                            <div className="flex gap-1 my-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setFeedbackRating(star)}
                                                        className="p-1 transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            size={28}
                                                            className={`transition-colors ${feedbackRating >= star
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                placeholder="Add remarks (optional)"
                                                value={feedbackRemarks}
                                                onChange={(e) => setFeedbackRemarks(e.target.value)}
                                                className="input w-full text-sm resize-none h-20 mb-3"
                                            />

                                            {/* Anonymous Toggle */}
                                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                                <button
                                                    onClick={() => setIsAnonymous(false)}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!isAnonymous
                                                        ? 'bg-red-500 text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <User size={14} className="inline mr-1" />
                                                    With my name
                                                </button>
                                                <button
                                                    onClick={() => setIsAnonymous(true)}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${isAnonymous
                                                        ? 'bg-gray-700 text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    🕵️ Anonymous
                                                </button>
                                            </div>

                                            <button
                                                onClick={submitFeedback}
                                                disabled={feedbackSubmitting || !feedbackRating}
                                                className="btn btn-primary w-full text-sm py-3 disabled:opacity-50"
                                                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                                            >
                                                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                    }
                </main >

                {/* Leave Modal */}
                {
                    isLeaveModalOpen && (
                        <LeaveModal
                            onClose={() => setIsLeaveModalOpen(false)}
                            onSubmit={applyBreak}
                        />
                    )
                }

                {/* Karma Animation */}
                {
                    karmaPop && (
                        <KarmaPop key={karmaPop.id} points={karmaPop.points} />
                    )
                }

                {/* Feedback Toast Notification */}
                {
                    feedbackToast && (
                        <div
                            className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-up ${feedbackToast.type === 'success'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {feedbackToast.type === 'success' ? (
                                    <Check size={20} />
                                ) : (
                                    <X size={20} />
                                )}
                                <span className="font-medium">{feedbackToast.message}</span>
                            </div>
                        </div>
                    )
                }

                <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(-50px); opacity: 0; }
                }
                .animate-float-up {
                    animation: floatUp 2s ease-out forwards;
                }
                .status-transition {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite ease-in-out;
                }
                .processing-overlay {
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(1px);
                    transition: opacity 0.3s ease;
                }
                @keyframes slideUp {
                    0% { transform: translateX(-50%) translateY(100%); opacity: 0; }
                    100% { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out forwards;
                }
            `}</style>
                <Footer />
            </div>
        </div>
    );
}

function KarmaPop({ points }) {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
            <div className="animate-float-up flex flex-col items-center">
                <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <Leaf size={24} className="animate-bounce" />
                    <span className="text-2xl font-black">+{points} Karma!</span>
                </div>
                <div className="text-green-600 font-bold text-sm mt-2 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                    {points === 3 ? "Guest Bonus ✨" : "Good Choice! 🌱"}
                </div>
            </div>
        </div>
    );
}

function LeaveModal({ onClose, onSubmit }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [reason, setReason] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

    const handleDateClick = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (date < today) return;

        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (date < startDate) {
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const isSelected = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (startDate && date.getTime() === startDate.getTime()) return 'bg-red-500 text-white rounded-l-lg';
        if (endDate && date.getTime() === endDate.getTime()) return 'bg-red-500 text-white rounded-r-lg';
        if (startDate && endDate && date > startDate && date < endDate) return 'bg-red-100 text-red-700';
        return '';
    };

    const isInRange = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return startDate && endDate && date >= startDate && date <= endDate;
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate) return;
        setLoading(true);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const result = await onSubmit(startStr, endStr, reason);
        setLoading(false);
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setTimeout(() => onClose(), 2000);
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Plan Your Break</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {message ? (
                        <div className={`p-8 text-center animate-fade-in`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {message.type === 'success' ? <Check size={32} /> : <X size={32} />}
                            </div>
                            <p className="font-bold text-lg mb-2">{message.type === 'success' ? 'Success!' : 'Oops!'}</p>
                            <p className="text-gray-500">{message.text}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between px-2">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="font-bold text-gray-700">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-y-1 text-center">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                    <span key={d} className="text-xs font-bold text-gray-400 py-2">{d}</span>
                                ))}
                                {Array(firstDay).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2"></div>
                                ))}
                                {Array(days).fill(null).map((_, i) => {
                                    const day = i + 1;
                                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                    const isPast = date < today;
                                    const styles = isSelected(day);

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDateClick(day)}
                                            disabled={isPast}
                                            className={`p-2 text-sm relative transition-all ${isPast ? 'text-gray-200' : 'text-gray-600 hover:bg-red-50'
                                                } ${styles}`}
                                        >
                                            <span className="relative z-10">{day}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Range Preview */}
                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Start Date</p>
                                    <p className="font-bold text-gray-700">
                                        {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">End Date</p>
                                    <p className="font-bold text-gray-700">
                                        {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                                    </p>
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Reason (Optional)</label>
                                <input
                                    type="text"
                                    className="input focus:ring-red-500"
                                    placeholder="Vacation, Sickness, etc."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!startDate || !endDate || loading}
                                className={`btn w-full py-4 text-lg ${loading ? 'opacity-70' : ''
                                    }`}
                                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                            >
                                {loading ? 'Submitting...' : 'Confirm Break'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
