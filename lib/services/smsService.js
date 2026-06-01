import { supabase } from '@/lib/utils/supabase';

export const smsService = {
    async getAdminOverview() {
        const response = await fetch('/api/admin/sms', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS overview failed');
        return result.data;
    },

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

    async approveRecharge(rechargeId, note = '') {
        const response = await fetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_recharge', rechargeId, note })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Recharge approve failed');
        return result;
    },

    async rejectRecharge(rechargeId, note = '') {
        const response = await fetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject_recharge', rechargeId, note })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Recharge reject failed');
        return result;
    },

    async getWallet(ownerType, ownerId) {
        const response = await fetch(`/api/sms/wallet?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS wallet failed');
        return result.data;
    },

    async requestRecharge(payload) {
        const response = await fetch('/api/sms/recharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Recharge request failed');
        return result.data;
    },

    async sendCampaign(payload) {
        const response = await fetch('/api/sms/campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS campaign failed');
        return result;
    },

    async previewCampaign(ownerType, ownerId, targetType, options = {}) {
        const params = new URLSearchParams({ ownerType, ownerId, targetType });
        if (options.targetOwnerId) params.set('targetOwnerId', options.targetOwnerId);
        const response = await fetch(`/api/sms/campaign?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS campaign preview failed');
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
