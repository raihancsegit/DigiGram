import { supabase } from '@/lib/utils/supabase';

export const smsService = {
    async getGateways() {
        const { data, error } = await supabase.from('sms_gateways').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getPackages() {
        const { data, error } = await supabase.from('sms_packages').select('*').order('credits', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createGateway(payload) {
        const response = await fetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_gateway', ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway create failed');
        return result.data;
    },

    async createPackage(payload) {
        const response = await fetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_package', ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Package create failed');
        return result.data;
    },

    async queueMessage(payload) {
        const response = await fetch('/api/sms/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS queue failed');
        return result;
    }
};
