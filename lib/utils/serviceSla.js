const DAY_MS = 24 * 60 * 60 * 1000;

export const SERVICE_SLA_DAYS = {
    birth_registration: 7,
    death_certificate: 3,
    utility_request: 5
};

export function getServiceSla(request, now = Date.now()) {
    const targetDays = SERVICE_SLA_DAYS[request?.request_type] || 5;
    const createdAt = request?.created_at ? new Date(request.created_at) : new Date(now);
    const createdTime = Number.isNaN(createdAt.getTime()) ? now : createdAt.getTime();
    const ageDays = Math.max(0, Math.floor((now - createdTime) / DAY_MS));
    const remainingDays = targetDays - ageDays;
    const dueDate = new Date(createdTime + targetDays * DAY_MS);
    const active = ['pending', 'processing', 'ready'].includes(request?.status);
    const readyWithoutCollection = request?.status === 'ready' && !request?.collection_date;

    let state = 'on_track';
    let priority = 1;

    if (!active) {
        state = 'closed';
        priority = 0;
    } else if (readyWithoutCollection) {
        state = 'collection_date_needed';
        priority = 3;
    } else if (remainingDays < 0) {
        state = 'overdue';
        priority = 4;
    } else if (remainingDays <= 1) {
        state = 'due_soon';
        priority = 2;
    }

    return {
        active,
        ageDays,
        dueDate,
        priority,
        progress: Math.min(100, Math.round((ageDays / targetDays) * 100)),
        remainingDays,
        state,
        targetDays
    };
}
