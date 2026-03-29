'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface Deployment {
    uid: string;
    name: string;
    url: string;
    created: number;
    state: string;
    creator: {
        username: string;
    };
    meta?: {
        githubCommitMessage?: string;
        githubCommitSha?: string;
    };
}

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Rollback state
    const [rollingBackId, setRollingBackId] = useState<string | null>(null);
    const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchDeployments();
    }, []);

    const fetchDeployments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/deployments');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch deployments');
            }

            setDeployments(data.deployments || []);
            setCurrentDeploymentId(data.currentDeploymentId || null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (deploymentId: string) => {
        if (!window.confirm('Are you SURE you want to rollback the live website to this version? This action is immediate.')) {
            return;
        }

        setRollingBackId(deploymentId);
        setError(null);
        setRollbackSuccess(null);

        try {
            const res = await fetch('/api/admin/deployments/rollback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deploymentId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initiate rollback');
            }

            setRollbackSuccess(`Successfully initiated rollback to deployment ${deploymentId}. It may take a minute to fully apply on Vercel.`);

            // Refresh list to show new deployment state if applicable
            setTimeout(() => fetchDeployments(), 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setRollingBackId(null);
        }
    };

    if (loading && deployments.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vercel Deployments</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View recent production deployments and rollback in case of an emergency.
                        <strong> Ensure your Vercel Token is configured in .env</strong>
                    </p>
                </div>
                <button
                    onClick={fetchDeployments}
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-50 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {rollbackSuccess && (
                <div className="p-4 rounded-md bg-green-50 flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 mr-3" />
                    <div>
                        <h3 className="text-sm font-medium text-green-800">Rollback Initiated</h3>
                        <p className="mt-1 text-sm text-green-700">{rollbackSuccess}</p>
                    </div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {deployments.length === 0 && !loading && !error && (
                        <li className="px-6 py-12 text-center text-gray-500">
                            No recent production deployments found.
                        </li>
                    )}
                    {deployments.map((dep) => {
                        const isCurrent = dep.uid === currentDeploymentId;
                        const date = new Date(dep.created);

                        return (
                            <li key={dep.uid} className={`px-6 py-5 ${isCurrent ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {dep.meta?.githubCommitMessage || 'Manual Deployment'}
                                            </p>
                                            {isCurrent && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Current Live
                                                </span>
                                            )}
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {dep.state}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                                            <div className="flex items-center">
                                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                                            </div>
                                            <div className="truncate flex items-center">
                                                <span className="mr-1">By:</span>
                                                <span className="font-medium text-gray-900">{dep.creator?.username || 'System'}</span>
                                            </div>
                                            {dep.meta?.githubCommitSha && (
                                                <div className="truncate flex items-center">
                                                    <span className="mr-1">Commit:</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                        {dep.meta.githubCommitSha.substring(0, 7)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-1">
                                            <Link href={`https://${dep.url}`} target="_blank" className="text-xs text-amber-600 hover:text-amber-800 transition-colors">
                                                View Build url ↗
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-4">
                                        <button
                                            onClick={() => handleRollback(dep.uid)}
                                            disabled={isCurrent || rollingBackId !== null}
                                            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                        ${(isCurrent || rollingBackId !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {rollingBackId === dep.uid ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Rolling back...
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw className="mr-2 h-4 w-4 text-gray-400" />
                                                    Revert to this
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
