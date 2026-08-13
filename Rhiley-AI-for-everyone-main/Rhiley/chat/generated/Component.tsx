'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PricingCard = () => {
    const [isActive, setIsActive] = useState(false);

    return (
        <motion.div 
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                    className="w-full h-full bg-[#07070f] opacity-3" 
                    style={{ backdropFilter: 'blur(12px)' }} 
                    initial={{ scale: 0.8 }}
                    animate={isActive ? { scale: 1 } : { scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            </div>

            <motion.div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4">Basic Plan</h2>
                <p className="text-gray-500 mb-8">For small businesses</p>
                <motion.span 
                    initial={{ y: '110%' }} 
                    animate={{ y: '0%', transition: { duration: 0.3 } }}
                    className="text-4xl font-bold">$9.99"
                />
                <p className="mt-4">Per month</p>
            </motion.div>

            <button 
                onClick={() => setIsActive(!isActive)}
                whileHover={{ scale: 1.04 }} 
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 mt-8"
            >
                Get Started
            </button>
        </motion.div>
    );
};

export default PricingCard;