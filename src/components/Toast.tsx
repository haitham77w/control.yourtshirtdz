import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    const icons = {
        success: <CheckCircle className="text-emerald-500" size={18} />,
        error: <XCircle className="text-rose-500" size={18} />,
        info: <Info className="text-blue-500" size={18} />,
    };

    const bgColors = {
        success: 'bg-emerald-50/90 border-emerald-100',
        error: 'bg-rose-50/90 border-rose-100',
        info: 'bg-blue-50/90 border-blue-100',
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={cn(
                        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md min-w-[300px] max-w-[90vw]",
                        bgColors[type]
                    )}
                >
                    {icons[type]}
                    <p className="flex-1 text-sm font-bold text-brand-black">{message}</p>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X size={16} className="text-brand-black/30" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
