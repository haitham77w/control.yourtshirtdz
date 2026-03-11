import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد الحذف',
    cancelText = 'إلغاء',
    variant = 'danger'
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm z-[210]"
                    />
                    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden"
                        >
                            <div className="p-6 text-right">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${variant === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {variant === 'danger' ? <Trash2 size={24} /> : <AlertCircle size={24} />}
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-brand-gray rounded-xl transition-colors">
                                        <X size={20} className="text-brand-black/30" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-brand-black mb-2">{title}</h3>
                                <p className="text-sm text-brand-black/50 leading-relaxed mb-8">{message}</p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${variant === 'danger'
                                                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                                                : 'bg-brand-black text-white hover:bg-brand-black/80'
                                            }`}
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 rounded-2xl font-bold text-sm bg-brand-gray text-brand-black hover:bg-brand-gray/80 transition-all"
                                    >
                                        {cancelText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
