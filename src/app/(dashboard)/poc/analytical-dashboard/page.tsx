import dynamic from 'next/dynamic';

const POCClient = dynamic(() => import('./poc-client'), {
    ssr: false,
    loading: () => <div className="p-12 text-center text-slate-400">A inicializar motor industrial...</div>
});

export default function AnalyticalDashboardPage() {
    return <POCClient />;
}
