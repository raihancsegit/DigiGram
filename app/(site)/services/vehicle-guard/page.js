import VehicleGuardView from './components/VehicleGuardView';

export const metadata = {
    title: 'ডিজি-বাহন (Vehicle Guard) | DigiGram',
    description: 'স্মার্ট বাহন ভেরিফিকেশন এবং এআই ডকুমেন্ট স্ক্যানার।',
};

export default async function VehicleGuardPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <VehicleGuardView unionSlug="south-union" />
            </div>
        </main>
    );
}
