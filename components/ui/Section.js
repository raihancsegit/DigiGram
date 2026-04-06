/**
 * সেকশন ওয়্রাপার — প্যাডিং/ভেরিয়েন্ট একই রকম রাখতে।
 * @param {'default' | 'services' | 'flush'} variant
 */
export default function Section({ id, variant = 'default', className = '', children, ...rest }) {
    const base = 'relative';
    const variants = {
        default: 'dg-section-x',
        services: 'dg-section-x dg-services-slab scroll-mt-24 pt-6 md:pt-10 pb-28 md:pb-36',
        flush: '',
    };
    return (
        <section id={id} className={[base, variants[variant] || variants.default, className].filter(Boolean).join(' ')} {...rest}>
            {variant === 'services' && <div className="dg-divider-fade absolute inset-x-0 top-0 pointer-events-none" aria-hidden />}
            {children}
        </section>
    );
}
