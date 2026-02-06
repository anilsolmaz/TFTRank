import Dashboard from "./components/Dashboard";

export default function Home() {
    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Modern Header */}
                <div className="text-center mb-12 relative">
                    <div className="inline-block">
                        <h1 className="text-6xl md:text-7xl font-black mb-2 gradient-text">
                            TFT SIRALAMA TAKİPÇİSİ
                        </h1>
                        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mb-2"></div>
                        <p className="text-text-muted text-sm tracking-wider uppercase">Türkiye Sunucusu • TR1</p>
                    </div>
                </div>

                <Dashboard />

                <div className="text-center mt-12">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>
                    <p className="text-text-muted text-xs">Powered by Riot Games API</p>
                </div>
            </div>
        </main>
    );
}
