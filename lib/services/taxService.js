import { supabase } from '@/lib/utils/supabase';

const toNumber = (value) => Number.parseFloat(value || 0) || 0;

export const taxService = {
    async getTaxByHousehold(householdId) {
        const { data, error } = await supabase
            .from('household_taxes')
            .select('*, payments:household_tax_payments(*)')
            .eq('household_id', householdId)
            .order('year', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addTaxRecord({
        household_id,
        year,
        fiscal_year_label,
        amount_due,
        due_date,
        notes,
        ward_no,
        holding_no,
        taxpayer_name,
        guardian_name,
        address,
        previous_due,
        current_tax,
        quarter_1,
        quarter_2,
        quarter_3,
        quarter_4
    }) {
        const quarterTotal = [quarter_1, quarter_2, quarter_3, quarter_4].reduce((sum, value) => sum + toNumber(value), 0);
        const computedDue = toNumber(amount_due) || toNumber(previous_due) + (toNumber(current_tax) || quarterTotal);

        const { data, error } = await supabase
            .from('household_taxes')
            .insert([{
                household_id,
                year: Number.parseInt(year, 10),
                fiscal_year_label: fiscal_year_label || `${year}-${Number(year) + 1}`,
                amount_due: computedDue,
                amount_paid: 0,
                due_date: due_date || null,
                notes: notes || null,
                ward_no: ward_no || null,
                holding_no: holding_no || null,
                taxpayer_name: taxpayer_name || null,
                guardian_name: guardian_name || null,
                address: address || null,
                previous_due: toNumber(previous_due),
                current_tax: toNumber(current_tax) || quarterTotal,
                quarter_1: toNumber(quarter_1),
                quarter_2: toNumber(quarter_2),
                quarter_3: toNumber(quarter_3),
                quarter_4: toNumber(quarter_4),
                status: 'due'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async recordPayment(taxId, paymentData) {
        const { data: current, error: fetchErr } = await supabase
            .from('household_taxes')
            .select('amount_due, amount_paid')
            .eq('id', taxId)
            .single();

        if (fetchErr) throw fetchErr;

        const paymentAmount = toNumber(paymentData.amount_paid);
        const newAmountPaid = toNumber(current.amount_paid) + paymentAmount;
        const amountDue = toNumber(current.amount_due);
        const newStatus = newAmountPaid >= amountDue ? 'paid' : newAmountPaid > 0 ? 'partial' : 'due';

        const { data: payment, error: paymentError } = await supabase
            .from('household_tax_payments')
            .insert([{
                tax_id: taxId,
                amount: paymentAmount,
                receipt_no: paymentData.receipt_no,
                paid_date: paymentData.paid_date || new Date().toISOString().split('T')[0],
                collected_by: paymentData.collected_by || null,
                payment_method: paymentData.payment_method || 'cash',
                notes: paymentData.notes || null
            }])
            .select()
            .single();

        if (paymentError) throw paymentError;

        const { data: tax, error } = await supabase
            .from('household_taxes')
            .update({
                amount_paid: newAmountPaid,
                receipt_no: payment.receipt_no,
                paid_date: payment.paid_date,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', taxId)
            .select()
            .single();

        if (error) throw error;
        return { tax, payment };
    },

    async deleteTaxRecord(taxId) {
        const { error } = await supabase
            .from('household_taxes')
            .delete()
            .eq('id', taxId);

        if (error) throw error;
        return true;
    },

    async getTaxSummaryByWard(wardId) {
        const { data, error } = await supabase
            .from('household_taxes')
            .select('amount_due, amount_paid, status, households!inner(ward_id)')
            .eq('households.ward_id', wardId);

        if (error) throw error;

        return (data || []).reduce((acc, tax) => ({
            totalDue: acc.totalDue + toNumber(tax.amount_due),
            totalPaid: acc.totalPaid + toNumber(tax.amount_paid),
            totalRecords: acc.totalRecords + 1,
            paidCount: acc.paidCount + (tax.status === 'paid' ? 1 : 0),
            dueCount: acc.dueCount + (tax.status === 'due' ? 1 : 0),
            partialCount: acc.partialCount + (tax.status === 'partial' ? 1 : 0)
        }), { totalDue: 0, totalPaid: 0, totalRecords: 0, paidCount: 0, dueCount: 0, partialCount: 0 });
    },

    async getTaxDashboardByUnion(unionId) {
        if (!unionId) {
            return {
                summary: { totalDue: 0, totalPaid: 0, totalOutstanding: 0, totalRecords: 0, paidCount: 0, dueCount: 0, partialCount: 0 },
                wardSummaries: [],
                recentPayments: []
            };
        }

        const { data: taxes, error: taxError } = await supabase
            .from('household_taxes')
            .select(`
                id,
                amount_due,
                amount_paid,
                status,
                year,
                household:households!inner(
                    ward_id,
                    house_no,
                    owner_name,
                    ward:locations!inner(id, name_bn, parent_id)
                )
            `)
            .eq('household.ward.parent_id', unionId);

        if (taxError) throw taxError;

        const { data: payments, error: paymentError } = await supabase
            .from('household_tax_payments')
            .select(`
                id,
                amount,
                receipt_no,
                paid_date,
                tax:household_taxes!inner(
                    year,
                    household:households!inner(
                        house_no,
                        owner_name,
                        ward:locations!inner(id, name_bn, parent_id)
                    )
                )
            `)
            .eq('tax.household.ward.parent_id', unionId)
            .order('paid_date', { ascending: false })
            .limit(8);

        if (paymentError) throw paymentError;

        const summary = (taxes || []).reduce((acc, tax) => ({
            totalDue: acc.totalDue + toNumber(tax.amount_due),
            totalPaid: acc.totalPaid + toNumber(tax.amount_paid),
            totalRecords: acc.totalRecords + 1,
            paidCount: acc.paidCount + (tax.status === 'paid' ? 1 : 0),
            dueCount: acc.dueCount + (tax.status === 'due' ? 1 : 0),
            partialCount: acc.partialCount + (tax.status === 'partial' ? 1 : 0)
        }), { totalDue: 0, totalPaid: 0, totalRecords: 0, paidCount: 0, dueCount: 0, partialCount: 0 });

        const wardMap = new Map();
        (taxes || []).forEach((tax) => {
            const ward = tax.household?.ward;
            if (!ward?.id) return;
            const current = wardMap.get(ward.id) || {
                wardId: ward.id,
                wardName: ward.name_bn,
                totalDue: 0,
                totalPaid: 0,
                totalRecords: 0,
                paidCount: 0,
                dueCount: 0,
                partialCount: 0
            };

            current.totalDue += toNumber(tax.amount_due);
            current.totalPaid += toNumber(tax.amount_paid);
            current.totalRecords += 1;
            current.paidCount += tax.status === 'paid' ? 1 : 0;
            current.dueCount += tax.status === 'due' ? 1 : 0;
            current.partialCount += tax.status === 'partial' ? 1 : 0;
            wardMap.set(ward.id, current);
        });

        return {
            summary: {
                ...summary,
                totalOutstanding: summary.totalDue - summary.totalPaid
            },
            wardSummaries: Array.from(wardMap.values())
                .map((ward) => ({
                    ...ward,
                    totalOutstanding: ward.totalDue - ward.totalPaid,
                    collectionRate: ward.totalDue > 0 ? Math.round((ward.totalPaid / ward.totalDue) * 100) : 0
                }))
                .sort((a, b) => a.wardName.localeCompare(b.wardName, 'bn')),
            recentPayments: payments || []
        };
    }
};
