import test from 'node:test';
import assert from 'node:assert/strict';

import { getSmsGatewayBalance, sendSmsViaGateway } from '../lib/services/smsProviderGateway.js';

test('BulkSMSBD gateway submits its token and Bangladesh number as form data', async () => {
    const originalFetch = globalThis.fetch;
    let request;
    globalThis.fetch = async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({
            response_code: 202,
            success_message: 'SMS Submitted Successfully 1'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    try {
        const result = await sendSmsViaGateway({
            provider: 'bulksmsbd',
            sender_id: 'DigiGram',
            api_base_url: 'https://bulksmsbd.net/api/smsapi',
            api_key: 'server-only-token',
            config: {
                method: 'POST',
                payload_mode: 'form',
                api_key_key: 'api_key',
                recipient_key: 'number',
                recipient_format: 'bd_e164_digits',
                message_key: 'message',
                sender_key: 'senderid',
                static_payload: { type: 'text' },
                success_path: 'response_code',
                success_values: [202]
            }
        }, {
            id: 'sms-test',
            recipient_phone: '+8801712345678',
            message: 'পরীক্ষামূলক বার্তা'
        });

        assert.equal(result.ok, true);
        assert.equal(result.deliveryStatus, 'accepted');
        assert.equal(request.url, 'https://bulksmsbd.net/api/smsapi');
        assert.equal(request.options.method, 'POST');
        assert.equal(request.options.headers.Authorization, undefined);
        const form = new URLSearchParams(request.options.body);
        assert.equal(form.get('api_key'), 'server-only-token');
        assert.equal(form.get('number'), '8801712345678');
        assert.equal(form.get('senderid'), 'DigiGram');
        assert.equal(form.get('type'), 'text');
        assert.equal(form.get('message'), 'পরীক্ষামূলক বার্তা');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('BulkSMSBD response_code errors are rejected with the provider message', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
        response_code: 1005,
        error_message: 'Sender ID is not approved'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    try {
        const result = await sendSmsViaGateway({
            provider: 'bulksmsbd',
            sender_id: 'Pending',
            api_base_url: 'https://bulksmsbd.net/api/smsapi',
            api_key: 'token',
            config: {
                payload_mode: 'form',
                api_key_key: 'api_key',
                success_path: 'response_code',
                success_values: [202]
            }
        }, { id: 'sms-test', recipient_phone: '+8801712345678', message: 'test' });

        assert.equal(result.ok, false);
        assert.equal(result.error, 'Sender ID is not approved');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('BulkSMSBD balance stays server-side and is parsed as a number', async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl;
    globalThis.fetch = async (url) => {
        requestedUrl = String(url);
        return new Response(JSON.stringify({ balance: '42.50' }), { status: 200 });
    };
    try {
        const result = await getSmsGatewayBalance({
            provider: 'bulksmsbd',
            api_key: 'private-token',
            config: { api_key_key: 'api_key', balance_url: 'https://bulksmsbd.net/api/getBalanceApi' }
        });
        assert.equal(result.ok, true);
        assert.equal(result.balance, 42.5);
        assert.match(requestedUrl, /api_key=private-token/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
