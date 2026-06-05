# DigiGram SMS Worker Setup

The SMS queue is processed by `GET/POST /api/sms/process`.

## Required database update

Run this SQL in Supabase:

```sql
-- database/59_sms_worker_gateway_readiness.sql
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
  "static_payload": {}
}
```

## Worker security

Set at least one environment variable:

- `SMS_WORKER_SECRET`: manual/external worker can call `/api/sms/process?secret=...&limit=50` or send header `x-worker-secret`.
- `CRON_SECRET`: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.

## Vercel cron

Add this only after confirming the Vercel plan supports the schedule you need.

```json
{
  "crons": [
    {
      "path": "/api/sms/process?limit=50",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Notes:

- Vercel cron uses UTC.
- Hobby plans may only support daily cron schedules. Use a daily schedule or upgrade before adding frequent cron.
- For urgent citizen SMS, a 1-5 minute schedule is better on Pro.
