# DigiGram SMS Worker Setup

The SMS queue is processed by `GET/POST /api/sms/process`.

## Required database update

Run this SQL in Supabase:

```sql
-- database/59_sms_worker_gateway_readiness.sql
-- database/68_sms_delivery_monitoring.sql
```

## Local/UAT test

1. Go to `Admin > SMS > Gateway`.
2. Select the `MOCK` preset.
3. Enable `Active gateway`.
4. Save.
5. Go to `Delivery Report`.
6. Click `Process now`.

The mock gateway marks queued SMS as sent without contacting a real provider.

## Production gateway

Use one of these presets:

- `JSON`: provider accepts JSON body.
- `FORM`: provider accepts `application/x-www-form-urlencoded`.
- `QUERY`: provider accepts query-string parameters.

Map the provider fields in config JSON:

```json
{
  "method": "POST",
  "payload_mode": "json",
  "recipient_key": "to",
  "message_key": "message",
  "sender_key": "sender_id",
  "headers": {},
  "static_payload": {},
  "success_path": "status",
  "success_values": ["success", "ok"],
  "api_key_env": "SMS_PROVIDER_API_KEY",
  "webhook_message_id_path": "message_id",
  "webhook_status_path": "status",
  "webhook_error_path": "error",
  "webhook_secret_env": "SMS_WEBHOOK_SECRET",
  "delivery_status_map": {
    "DELIVRD": "delivered",
    "REJECTD": "failed"
  }
}
```

`api_key_env` is recommended for production. Put the real secret in Vercel
environment variables instead of the JSON config. The database `api_key`
field remains available for providers that cannot use an environment-backed
configuration, but it is never returned by the admin API.

The worker now:

- atomically claims messages so two workers cannot send the same SMS;
- tries active gateways by priority and fails over to the next provider;
- retries transient failures after 5, 10, 20, and 40 minutes;
- records provider response, duration, and HTTP status;
- marks gateway health as healthy, degraded, or down;
- lets Super Admin retry failed messages from the Delivery Report.

## Delivery webhook

Run this additional migration:

```sql
-- database/69_sms_failover_webhook.sql
```

Each gateway gets this callback URL:

```text
https://YOUR_DOMAIN/api/sms/webhook/GATEWAY_ID
```

Configure the provider to call it with `POST`. Authenticate with one of:

- `Authorization: Bearer <SMS_WEBHOOK_SECRET>`
- `x-webhook-secret: <SMS_WEBHOOK_SECRET>`
- HMAC signature configured with `webhook_signature_header`,
  `webhook_hmac_algorithm`, and `webhook_signature_encoding`.

The provider-specific message id/status fields are mapped through gateway
config. An accepted SMS remains `sent`; only a verified provider callback
marks it `delivered`.

## Worker security

Set at least one environment variable:

- `SMS_WORKER_SECRET`: manual/external worker sends `Authorization: Bearer <SMS_WORKER_SECRET>` or the `x-worker-secret` header.
- `CRON_SECRET`: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.

The worker endpoint is closed when no valid worker secret or authenticated
Super Admin token is present.

## Vercel cron

The repository includes a deployment-safe daily schedule:

```json
{
  "crons": [
    {
      "path": "/api/sms/process?limit=100",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Notes:

- Vercel cron uses UTC.
- Hobby supports only a daily schedule.
- On Vercel Pro, change the schedule to `*/5 * * * *` for a five-minute worker.
- For urgent citizen SMS on Hobby, use an external scheduler to call the same
  endpoint with `Authorization: Bearer <SMS_WORKER_SECRET>`.
