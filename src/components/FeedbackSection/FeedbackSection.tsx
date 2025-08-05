// src/components/FeedbackSection/FeedbackSection.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Feedback {
    id: string;
    text: string;
    author: {
        id: string;
        usuario?: string;
        email: string;
    };
    createdAt: string;
}

interface FeedbackSectionProps {
    listingId: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ listingId }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!listingId) {
            setLoading(false);
            return;
        }

        const fetchFeedbacks = async () => {
            try {
                const resFeedbacks = await fetch(`/api/feedback/${listingId}`);
                if (resFeedbacks.ok) {
                    const data = await resFeedbacks.json();
                    setFeedbacks(data);
                } else {
                    toast.error('Erro ao carregar feedbacks.');
                }
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
                toast.error('Erro ao carregar informações de feedback.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, [listingId]);

    const getTruncatedName = (name: string | undefined) => {
        if (!name) return '';
        return name.substring(0, 3) + '...';
    };

    return (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-gray-200 mb-4">Feedbacks ({feedbacks.length})</h2>
            
            <div className="flex-1">
                {loading ? (
                    <p className="text-gray-400">Carregando feedbacks...</p>
                ) : feedbacks.length > 0 ? (
                    <div className="space-y-4">
                        {feedbacks.map(feedback => (
                            <div key={feedback.id} className="p-4 bg-gray-700 rounded-md">
                                <p className="text-gray-300">{feedback.text}</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Por <span className="font-semibold">{getTruncatedName(feedback.author.usuario || feedback.author.email)}</span> em {new Date(feedback.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Nenhum feedback feito ainda.</p>
                )}
            </div>
        </div>
    );
};

export default FeedbackSection;