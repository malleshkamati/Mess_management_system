import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, TrendingUp, Users, Leaf, ArrowRight, ShieldCheck, Clock, Star, Vote, UserPlus, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/mess_master_logo.png';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // ... (useEffect remains same)

    useEffect(() => {
        if (user) {
            if (user.role === 'admin' || user.role === 'manager') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 border border-red-50">
                            <img src={logo} alt="MessMaster Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                            MessMaster
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
                        >
                            Get Started <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-red-50/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full text-red-600 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
                        <Leaf size={14} /> Sustainable Dining
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                        Smart Dining for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                            Modern Campuses
                        </span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Eliminate food waste and streamline mess operations
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
                        >
                            Start Now
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        {/* <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <Clock size={20} className="text-gray-400" /> View Demo
                        </button> */}
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run a smart mess</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">From precise forecasting to student engagement, we've got every aspect of hostel dining covered.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-red-100">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600 group-hover:scale-110 transition-transform">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Demand Prediction</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Our intelligent algorithms analyze historical data to predict exact meal quantities, reducing food wastage by up to 40%.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-blue-100">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Attendance</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Opt-out by default system ensures accurate counts. detailed dashboards help admins track attendance patterns in real-time.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-green-100">
                            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                                <Leaf size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Waste Goal</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Track food saved, karma points for responsible behavior, and comprehensive wastage analytics to build a sustainable ecosystem.
                            </p>
                        </div>

                        {/* Feature 4: Karma */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-yellow-100">
                            <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition-transform">
                                <Star size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Karma Rewards</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Gamify responsible behavior! Students earn karma points for informing about leave in advance, which can be redeemed for perks.
                            </p>
                        </div>

                        {/* Feature 5: Polls */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-purple-100">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                                <Vote size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Community Polls</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Let students vote on the next Sunday Special! Built-in polling system democratizes menu planning and improves satisfaction.
                            </p>
                        </div>

                        {/* Feature 6: Guests */}
                        <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-100">
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <UserPlus size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Guest Mgt.</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Hosting friends? Students can register guests in advance, paying seamlessly while ensuring the kitchen prepares enough food.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Stats */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] opacity-10 bg-cover bg-center"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div>
                            <div className="text-5xl font-extrabold text-red-500 mb-2">15k+</div>
                            <div className="text-gray-400 font-medium tracking-wide">Meals Managed</div>
                        </div>
                        <div>
                            <div className="text-5xl font-extrabold text-blue-500 mb-2">40%</div>
                            <div className="text-gray-400 font-medium tracking-wide">Waste Reduction</div>
                        </div>
                        <div>
                            <div className="text-5xl font-extrabold text-green-500 mb-2">500+</div>
                            <div className="text-gray-400 font-medium tracking-wide">Happy Students</div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-100 p-0.5">
                            <img src={logo} alt="MessMaster Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <span className="font-bold text-gray-700">MessMaster</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                        © 2026 MessMaster. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-gray-600 text-sm">Privacy</a>
                        <a href="#" className="text-gray-400 hover:text-gray-600 text-sm">Terms</a>
                        <a href="#" className="text-gray-400 hover:text-gray-600 text-sm">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
