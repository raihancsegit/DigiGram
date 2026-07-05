import { supabase } from '@/lib/utils/supabase';
import { authenticatedFetch } from '@/lib/utils/authenticated-fetch';

export const smsService = {
    async getAdminOverview() {
        const response = await authenticatedFetch('/api/admin/sms', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS overview failed');
        return result.data;
    },

    async getPackages() {
        const { data, error } = await supabase.from('sms_packages').select('*').order('credits', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createGateway(payload) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_gateway', ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway create failed');
        return result.data;
    },

    async updateGateway(gatewayId, payload) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_gateway', gatewayId, ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway update failed');
        return result.data;
    },

    async deleteGateway(gatewayId) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_gateway', gatewayId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway delete failed');
        return result;
    },

    async createPackage(payload) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_package', ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Package create failed');
        return result.data;
    },

    async updatePackage(packageId, payload) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_package', packageId, ...payload })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Package update failed');
        return result.data;
    },

    async togglePackage(packageId, isActive) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_package', packageId, isActive })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Package update failed');
        return result.data;
    },

    async deletePackage(packageId) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_package', packageId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Package delete failed');
        return result;
    },

    async approveRecharge(rechargeId, note = '') {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_recharge', rechargeId, note })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Recharge approve failed');
        return result;
    },

    async rejectRecharge(rechargeId, note = '') {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject_recharge', rechargeId, note })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Recharge reject failed');
        return result;
    },

    async adjustWallet(ownerType, ownerId, credits, note) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'adjust_wallet', ownerType, ownerId, credits, note })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Wallet adjustment failed');
        return result;
    },

    async getWallet(ownerType, ownerId) {
        const response = await authenticatedFetch(`/api/sms/wallet?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}`, { cache: 'no-store' });
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
        const response = await authenticatedFetch('/api/sms/campaign', {
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
        const response = await authenticatedFetch(`/api/sms/campaign?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS campaign preview failed');
        return result.data;
    },

    async queueMessage(payload) {
        const response = await authenticatedFetch('/api/sms/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS queue failed');
        return result;
    },

    async processQueue(limit = 50) {
        const response = await authenticatedFetch('/api/sms/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS processing failed');
        return result;
    },

    async retryFailedMessages(messageIds = []) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'retry_failed', messageIds })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'SMS retry failed');
        return result;
    },

    async toggleGateway(gatewayId, isActive) {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_gateway', gatewayId, isActive })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway update failed');
        return result.data;
    },

    async testGateway(gatewayId, phone, message = '') {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test_gateway', gatewayId, phone, message })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gateway test failed');
        return result.data;
    },

    async quickTestSms(phone, message = '') {
        const response = await authenticatedFetch('/api/admin/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'quick_test_sms', phone, message })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Quick SMS test failed');
        return result.data;
    }
};
