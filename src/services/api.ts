import { useState, useEffect, useCallback } from 'react';

export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

export interface AppVersion {
    id: number;
    version: string;
    download_url: string;
    changelog: string;
    is_critical: boolean;
    created_at: string;
}

interface InitialData {
    announcements: Announcement[];
    latestVersion: AppVersion | null;
    hasUpdate: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const isConfigured = Boolean(API_URL && API_KEY);

async function query<T>(table: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!isConfigured) return null;
    try {
        const url = new URL(`${API_URL}/rest/v1/${table}`);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await fetch(url.toString(), {
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

export const useInitialData = (currentVersion: string) => {
    const [data, setData] = useState<InitialData>({
        announcements: [],
        latestVersion: null,
        hasUpdate: false,
    });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const fetchInitialData = useCallback(async () => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setFetchError(false);
            const now = new Date().toISOString();
            const [announcements, versions] = await Promise.all([
                query<Announcement[]>('announcements', {
                    'is_active': 'eq.true',
                    'or': `(expires_at.is.null,expires_at.gt.${now})`,
                    'order': 'priority.desc,created_at.desc',
                    'select': '*',
                }),
                query<AppVersion[]>('app_versions', {
                    'order': 'created_at.desc',
                    'limit': '1',
                    'select': '*',
                }),
            ]);
            if (!announcements && !versions) {
                setFetchError(true);
                return;
            }
            const latestVersion = versions?.[0] || null;
            const hasUpdate = latestVersion
                ? compareVersions(latestVersion.version, currentVersion) > 0
                : false;
            setData({
                announcements: announcements || [],
                latestVersion,
                hasUpdate,
            });
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, [currentVersion]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    return {
        ...data,
        loading,
        fetchError,
        refresh: fetchInitialData,
    };
};
