import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TreePine, Shield, Download, History, Share2 } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TreePine className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold gradient-text">FamilyTree</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/signin" className="btn-secondary">
                            Sign In
                        </Link>
                        <Link to="/signup" className="btn-primary">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                        Preserve Your Family's
                        <br />
                        <span className="gradient-text">Legacy Forever</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto">
                        Build, visualize, and share your family tree with an intuitive platform designed
                        for collaboration. Connect generations, preserve memories, and discover your roots.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                            Start Your Tree Free
                        </Link>
                        <a href="#features" className="btn-secondary text-lg px-8 py-4">
                            Learn More
                        </a>
                    </div>

                    {/* Hero Illustration */}
                    <div className="mt-16 relative">
                        <div className="card max-w-5xl mx-auto p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/10"></div>
                            <div className="relative">
                                <div className="flex items-center justify-center gap-8 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                                        👴
                                    </div>
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                                        👵
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        👨
                                    </div>
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        👩
                                    </div>
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        👨
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                        👧
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                        👦
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                        👶
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-white/50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                        Everything You Need to Build Your
                        <span className="gradient-text"> Family Story</span>
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-8 h-8" />}
                            title="Multi-Family Support"
                            description="Manage multiple family trees with separate access controls. Perfect for genealogy researchers and family historians."
                            color="from-blue-500 to-cyan-500"
                        />
                        <FeatureCard
                            icon={<TreePine className="w-8 h-8" />}
                            title="Smart Relationship Mapping"
                            description="Automatically detect and map family relationships. Our AI helps identify duplicate entries and suggests connections."
                            color="from-green-500 to-emerald-500"
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Secure & Private"
                            description="Role-based access control ensures only authorized family members can view and edit. Your data is encrypted and protected."
                            color="from-purple-500 to-pink-500"
                        />
                        <FeatureCard
                            icon={<Download className="w-8 h-8" />}
                            title="Export Anywhere"
                            description="Download your family tree as PNG, PDF, or CSV. Share beautiful visualizations or import data into other tools."
                            color="from-orange-500 to-red-500"
                        />
                        <FeatureCard
                            icon={<History className="w-8 h-8" />}
                            title="Rich Family History"
                            description="Document stories, upload photos, and preserve memories. Create a living archive for future generations."
                            color="from-yellow-500 to-amber-500"
                        />
                        <FeatureCard
                            icon={<Share2 className="w-8 h-8" />}
                            title="Collaborative Editing"
                            description="Invite family members to contribute. Multiple roles ensure everyone can participate while maintaining data integrity."
                            color="from-indigo-500 to-blue-500"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
                        <p className="text-xl mb-8 text-white/90">
                            Join thousands of families preserving their heritage. Get started for free today.
                        </p>
                        <Link
                            to="/signup"
                            className="inline-block bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Create Your Free Family Tree
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto text-center text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <TreePine className="w-6 h-6 text-blue-600" />
                        <span className="text-xl font-bold gradient-text">FamilyTree</span>
                    </div>
                    <p>&copy; 2026 FamilyTree. Preserving memories, connecting generations.</p>
                </div>
            </footer>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
    return (
        <div className="card group hover:scale-105 transition-transform duration-300">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{description}</p>
        </div>
    );
};

export default LandingPage;
