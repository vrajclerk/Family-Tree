import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { useAuditLog } from '../hooks/useAuditLog';
import { getAuditLabel } from '../utils/auditLabels';

interface ActivityLogProps {
    familyId: string;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ familyId }) => {
    const { data: auditLogs, isLoading } = useAuditLog(familyId);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="card">
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-5 h-5 animate-spin text-slate-400" />
                </div>
            </div>
        );
    }

    if (!auditLogs || auditLogs.length === 0) {
        return (
            <div className="card text-center py-8 text-slate-500">
                No activity yet
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getActorName = (entry: any) => {
        if (!entry.users) return 'System';
        return entry.users.full_name || entry.users.email || 'Unknown';
    };

    const renderDiff = (changes: any) => {
        if (!changes || typeof changes !== 'object') {
            return <div className="text-sm text-slate-500">No changes tracked</div>;
        }

        const before = changes.before || {};
        const after = changes.after || {};

        // Find keys that differ
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        const changedKeys = Array.from(allKeys).filter(key => {
            const beforeVal = JSON.stringify(before[key]);
            const afterVal = JSON.stringify(after[key]);
            return beforeVal !== afterVal;
        });

        if (changedKeys.length === 0) {
            return <div className="text-sm text-slate-500">No changes tracked</div>;
        }

        return (
            <div className="space-y-2">
                {changedKeys.map(key => (
                    <div key={key} className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{key}:</span>
                        <div className="text-red-600 dark:text-red-400">
                            - {String(before[key] ?? 'null')}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                            + {String(after[key] ?? 'null')}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold">Activity Log</h2>
                <span className="text-sm text-slate-500">Last {auditLogs.length} events</span>
            </div>

            <div className="space-y-2">
                {auditLogs.map((entry: any, idx: number) => (
                    <div key={`${entry.id}-${idx}`} className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {getActorName(entry)}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {getAuditLabel(entry.action as 'INSERT' | 'UPDATE' | 'DELETE', entry.entity_type)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>{formatDate(entry.created_at)}</span>
                                {entry.action === 'UPDATE' && (
                                    expandedId === entry.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />
                                )}
                            </div>
                        </div>

                        {expandedId === entry.id && entry.action === 'UPDATE' && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                                {renderDiff(entry.changes)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityLog;
