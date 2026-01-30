import React from 'react';

const Footer = () => {
    return (
        <footer className="mt-auto py-8 bg-white border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                            MessMaster
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Smart Meal Management System</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} MessMaster. Built for efficiency.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="#" className="text-xs text-gray-500 hover:text-red-500 transition-colors">Support</a>
                            <a href="#" className="text-xs text-gray-500 hover:text-red-500 transition-colors">Privacy Policy</a>
                            <a href="#" className="text-xs text-gray-500 hover:text-red-500 transition-colors">Feedback</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
