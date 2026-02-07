"use client";

import { useEffect, useState } from 'react';
import { Player, MatchResult } from '@/types';
import { Loader2, RefreshCw, Trophy, Award, Zap, Settings, Target, Medal, Swords } from 'lucide-react';

// Custom Point System: 1st=+4, 2nd=+3, 3rd=+2, 4th=+1, 5th=-1, 6th=-2, 7th=-3, 8th=-4
const getPoints = (placement: number): number => {
    const pointMap: { [key: number]: number } = {
        1: 4, 2: 3, 3: 2, 4: 1,
        5: -1, 6: -2, 7: -3, 8: -4
    };
    return pointMap[placement] || 0;
};

interface CommonMatch {
    matchId: string;
    placements: { [puuid: string]: number };
    timestamp: number;
}

type GameCount = 10 | 20;

export default function Dashboard() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [gameCount, setGameCount] = useState<number>(20);
    const [dateFilter, setDateFilter] = useState<'today' | 'last10' | 'last20'>('last20');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/stats', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
            const data = await res.json();
            setPlayers(data);
            if (Array.isArray(data) && data.length === 0) {
                setError('No player data found.');
            }
        } catch (err: any) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 1 minute (60 seconds)
        const interval = setInterval(() => {
            fetchData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Filter matches based on selected game count (API returns max 20)
    const getFilteredMatches = (player: Player): MatchResult[] => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let filtered = player.recentMatches;

        if (dateFilter === 'today') {
            filtered = filtered.filter(match => match.gameDetail.game_datetime >= startOfToday);
        } else if (dateFilter === 'last10') {
            filtered = filtered.slice(0, 10);
        } else if (dateFilter === 'last20') {
            filtered = filtered.slice(0, 20);
        }

        return filtered;
    };

    // Find common matches where at least 2 players played together
    const getCommonMatches = (): CommonMatch[] => {
        if (players.length < 2) return [];

        const matchMap = new Map<string, { placements: Map<string, number>, timestamp: number }>();

        players.forEach(player => {
            const filteredMatches = getFilteredMatches(player);
            filteredMatches.forEach(match => {
                if (!matchMap.has(match.matchId)) {
                    matchMap.set(match.matchId, {
                        placements: new Map(),
                        timestamp: match.gameDetail.game_datetime
                    });
                }
                matchMap.get(match.matchId)!.placements.set(player.puuid, match.placement);
            });
        });

        const commonMatches: CommonMatch[] = [];
        matchMap.forEach((data, matchId) => {
            // Changed from all players to at least 2 players
            if (data.placements.size >= 2) {
                const placementsObj: { [puuid: string]: number } = {};
                data.placements.forEach((placement, puuid) => {
                    placementsObj[puuid] = placement;
                });
                commonMatches.push({
                    matchId,
                    placements: placementsObj,
                    timestamp: data.timestamp
                });
            }
        });

        return commonMatches.sort((a, b) => b.timestamp - a.timestamp);
    };

    const commonMatches = getCommonMatches();

    // Calculate stats for each player
    const playerStats = players.map(player => {
        const filteredMatches = getFilteredMatches(player);
        const allMatches = player.recentMatches; // All-time stats

        // Filtered stats
        const totalPoints = filteredMatches.reduce((sum, match) => sum + getPoints(match.placement), 0);
        const avgPoints = filteredMatches.length > 0
            ? (totalPoints / filteredMatches.length).toFixed(1)
            : '0';
        const avgPlacement = filteredMatches.length > 0
            ? (filteredMatches.reduce((acc, m) => acc + m.placement, 0) / filteredMatches.length).toFixed(2)
            : 'N/A';
        const top4Count = filteredMatches.filter(m => m.placement <= 4).length;
        const top4Rate = filteredMatches.length > 0
            ? ((top4Count / filteredMatches.length) * 100).toFixed(0)
            : '0';
        const winCount = filteredMatches.filter(m => m.placement === 1).length;
        const winRate = filteredMatches.length > 0
            ? ((winCount / filteredMatches.length) * 100).toFixed(0)
            : '0';

        // All-time stats
        const allTimeGames = allMatches.length;
        const allTimeAvgPlacement = allTimeGames > 0
            ? (allMatches.reduce((acc, m) => acc + m.placement, 0) / allTimeGames).toFixed(2)
            : 'N/A';

        // Head-to-head: count only matches where THIS player participated
        const playerCommonMatches = commonMatches.filter(cm => cm.placements[player.puuid] !== undefined);
        const commonPoints = playerCommonMatches.reduce((sum, cm) => {
            const placement = cm.placements[player.puuid];
            return sum + (placement ? getPoints(placement) : 0);
        }, 0);

        return {
            player,
            totalPoints,
            avgPoints,
            avgPlacement,
            top4Count,
            top4Rate,
            winCount,
            winRate,
            commonPoints,
            commonGamesCount: playerCommonMatches.length, // Actual count for this player
            filteredGames: filteredMatches.length,
            totalGamesAvailable: player.recentMatches.length
        };
    });

    // Rank by total points
    const rankedPlayers = [...playerStats].sort((a, b) => b.totalPoints - a.totalPoints);

    const getPlacementClass = (placement: number) => {
        if (placement === 1) return 'placement-first';
        if (placement <= 4) return 'placement-top4';
        return 'placement-bottom';
    };

    const getRankColor = (tier?: string) => {
        if (!tier) return 'rank-unranked';
        switch (tier.toUpperCase()) {
            case 'CHALLENGER': return 'rank-challenger';
            case 'GRANDMASTER': return 'rank-grandmaster';
            case 'MASTER': return 'rank-master';
            case 'DIAMOND': return 'rank-diamond';
            case 'PLATINUM': return 'rank-platinum';
            case 'GOLD': return 'rank-gold';
            default: return 'rank-default';
        }
    };

    if (loading && players.length === 0) {
        return (
            <div className="loading-container">
                <Loader2 className="loading-spinner" />
                <p className="loading-text">Oyuncu verileri yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Controls */}
            <div className="controls">
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="refresh-button"
                >
                    {loading ? <Loader2 className="spinner-small" /> : <RefreshCw />}
                    <span>İstatistikleri Yenile</span>
                </button>

                {/* Game Count & Date Filter Settings */}
                <div className="settings-panel">
                    <label className="settings-label">
                        <Settings size={16} />
                        Oyun Sayısı
                    </label>
                    <div className="count-options">
                        <button
                            onClick={() => setDateFilter('today')}
                            className={`count-option ${dateFilter === 'today' ? 'active' : ''}`}
                        >
                            Bugün Oynanan
                        </button>
                        <button
                            onClick={() => {
                                setDateFilter('last10');
                                setGameCount(10);
                            }}
                            className={`count-option ${dateFilter === 'last10' ? 'active' : ''}`}
                        >
                            Son 10
                        </button>
                        <button
                            onClick={() => {
                                setDateFilter('last20');
                                setGameCount(20);
                            }}
                            className={`count-option ${dateFilter === 'last20' ? 'active' : ''}`}
                        >
                            Son 20
                        </button>
                    </div>
                </div>
            </div>

            {/* Point System Info */}
            <div className="points-info-grid">
                <div className="points-info-header">
                    <Zap size={18} />
                    <span>Puan Sistemi</span>
                </div>
                <div className="points-section">
                    <div className="points-section-label">Kazanılan Puanlar</div>
                    <div className="points-row">
                        <div className="points-item gold">
                            <span className="rank-pos">1.</span>
                            <span className="points-value">+4</span>
                        </div>
                        <div className="points-item silver">
                            <span className="rank-pos">2.</span>
                            <span className="points-value">+3</span>
                        </div>
                        <div className="points-item bronze">
                            <span className="rank-pos">3.</span>
                            <span className="points-value">+2</span>
                        </div>
                        <div className="points-item green">
                            <span className="rank-pos">4.</span>
                            <span className="points-value">+1</span>
                        </div>
                    </div>
                </div>
                <div className="points-section">
                    <div className="points-section-label">Kaybedilen Puanlar</div>
                    <div className="points-row">
                        <div className="points-item red-light">
                            <span className="rank-pos">5.</span>
                            <span className="points-value">-1</span>
                        </div>
                        <div className="points-item red-medium">
                            <span className="rank-pos">6.</span>
                            <span className="points-value">-2</span>
                        </div>
                        <div className="points-item red-dark">
                            <span className="rank-pos">7.</span>
                            <span className="points-value">-3</span>
                        </div>
                        <div className="points-item red-darkest">
                            <span className="rank-pos">8.</span>
                            <span className="points-value">-4</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 1: POINT SYSTEM STATS */}
            <div className="stats-section">
                <h2 className="section-header">
                    <Zap size={20} />
                    Puan Sistemi Sıralaması
                </h2>
                <div className="comparison-table">
                    {/* Players Header */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Oyuncu Adı</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ player }, index) => (
                                <div key={player.puuid} className="stat-cell">
                                    <div className="player-card">
                                        {index === 0 && <Trophy className="trophy-icon gold" size={24} />}
                                        {index === 1 && <Trophy className="trophy-icon silver" size={24} />}
                                        {index === 2 && <Trophy className="trophy-icon bronze" size={24} />}
                                        <div className="avatar-container">
                                            <img
                                                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${player.profileIconId}.jpg`}
                                                alt={player.name}
                                                className="player-avatar"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/0.jpg' }}
                                            />
                                        </div>
                                        <p className="player-name">{player.name}</p>
                                        <p className="player-tag">#{player.tag}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Points (Toplam Puan) */}
                    <div className="stat-section-block highlight">
                        <div className="stat-section-label">Toplam Puan</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ totalPoints, filteredGames, player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <p className="stat-huge stat-accent">{totalPoints}</p>
                                    <p className="stat-small">{filteredGames} toplam oyun</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Solo Points */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Solo Puan</div>
                        <div className="stat-grid-4">
                            {(() => {
                                // Create separate ranking for solo points
                                const soloRanked = rankedPlayers
                                    .map(({ totalPoints, commonPoints, filteredGames, commonGamesCount, player }) => ({
                                        player,
                                        soloPoints: totalPoints - commonPoints,
                                        soloGames: filteredGames - commonGamesCount
                                    }))
                                    .sort((a, b) => b.soloPoints - a.soloPoints);

                                return rankedPlayers.map(({ player, totalPoints, commonPoints, filteredGames, commonGamesCount }) => {
                                    const soloPoints = totalPoints - commonPoints;
                                    const soloGames = filteredGames - commonGamesCount;
                                    const soloRank = soloRanked.findIndex(s => s.player.puuid === player.puuid);

                                    return (
                                        <div key={player.puuid} className="stat-cell">
                                            <div className="stat-with-trophy">
                                                <p className="stat-large stat-primary">{soloPoints}</p>
                                                {soloRank === 0 && <Trophy className="mini-trophy gold" size={16} />}
                                                {soloRank === 1 && <Trophy className="mini-trophy silver" size={16} />}
                                                {soloRank === 2 && <Trophy className="mini-trophy bronze" size={16} />}
                                            </div>
                                            <p className="stat-small">{soloGames} solo oyun</p>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Head to Head Points */}
                    {commonMatches.length > 0 && (
                        <div className="stat-section-block">
                            <div className="stat-section-label">Ortak Puan</div>
                            <div className="stat-grid-4">
                                {(() => {
                                    // Create separate ranking for ortak points
                                    const ortakRanked = rankedPlayers
                                        .map(({ commonPoints, commonGamesCount, player }) => ({
                                            player,
                                            commonPoints,
                                            commonGamesCount
                                        }))
                                        .sort((a, b) => b.commonPoints - a.commonPoints);

                                    return rankedPlayers.map(({ player, commonPoints, commonGamesCount }) => {
                                        const ortakRank = ortakRanked.findIndex(o => o.player.puuid === player.puuid);

                                        return (
                                            <div key={player.puuid} className="stat-cell">
                                                <div className="stat-with-trophy">
                                                    <p className="stat-large stat-accent">{commonPoints}</p>
                                                    {ortakRank === 0 && <Trophy className="mini-trophy gold" size={16} />}
                                                    {ortakRank === 1 && <Trophy className="mini-trophy silver" size={16} />}
                                                    {ortakRank === 2 && <Trophy className="mini-trophy bronze" size={16} />}
                                                </div>
                                                <p className="stat-small">{commonGamesCount} ortak oyun</p>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: GAME STATISTICS */}
            <div className="stats-section">
                <h2 className="section-header">
                    <Target size={20} />
                    Oyun İstatistikleri
                </h2>
                <div className="comparison-table">
                    {/* Player Headers */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Oyuncular</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ player }, index) => (
                                <div key={player.puuid} className="stat-cell">
                                    <div className="player-info-column">
                                        {index === 0 && <Trophy className="trophy-icon gold" size={24} />}
                                        {index === 1 && <Trophy className="trophy-icon silver" size={24} />}
                                        {index === 2 && <Trophy className="trophy-icon bronze" size={24} />}
                                        <div className="avatar-container">
                                            <img
                                                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${player.profileIconId}.jpg`}
                                                alt={player.name}
                                                className="player-avatar"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/0.jpg' }}
                                            />
                                        </div>
                                        <p className="player-name">{player.name}</p>
                                        <p className="player-tag">#{player.tag}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysed Games */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Analiz Edilen Oyun</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ filteredGames, totalGamesAvailable, player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <p className="stat-large stat-primary">{filteredGames}</p>
                                    <p className="stat-small">toplam {totalGamesAvailable} oyun mevcut</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Avg Placement */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Ort. Sıralama</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ avgPlacement, player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <p className="stat-large stat-primary">{avgPlacement}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top 4 Rate */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">İlk 4 Oranı</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ top4Count, top4Rate, filteredGames, player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <p className="stat-large stat-success">{top4Rate}%</p>
                                    <p className="stat-small">{top4Count}/{filteredGames} oyun</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Win Rate */}
                    <div className="stat-section-block">
                        <div className="stat-section-label">Kazanma Oranı (1. Yer)</div>
                        <div className="stat-grid-4">
                            {rankedPlayers.map(({ winCount, winRate, filteredGames, player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <p className="stat-large stat-accent">{winRate}%</p>
                                    <p className="stat-small">{winCount}/{filteredGames} galibiyet</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>


            {/* SECTION 3: LAST 20 GAMES GRID - Only show if there are games */}
            {rankedPlayers.some(({ player }) => getFilteredMatches(player).length > 0) && (
                <div className="stats-section">
                    <h2 className="section-header">
                        <Target size={20} />
                        Son 20 Oyun
                    </h2>
                    <div className="comparison-table">
                        <div className="last-games-grid-container">
                            {rankedPlayers.map(({ player }) => {
                                const playerMatches = getFilteredMatches(player).slice(0, 20);

                                // Skip if no games
                                if (playerMatches.length === 0) return null;

                                return (
                                    <div key={player.puuid} className="player-games-grid">
                                        <div className="games-grid-header">{player.name}</div>
                                        <div
                                            className="games-grid"
                                            style={{
                                                // Dynamic sizing: fewer games = bigger cells (max 2rem)
                                                '--cell-size': `min(${Math.max(0.95, Math.min(2, 20 / playerMatches.length))}rem, 2rem)`
                                            } as React.CSSProperties}
                                        >
                                            {playerMatches.map((match, idx) => (
                                                <div
                                                    key={match.matchId}
                                                    className={`game-cell placement-${match.placement}`}
                                                >
                                                    {match.placement}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 4: HEAD-TO-HEAD MATCHES */}
            {commonMatches.length > 0 && (
                <div className="stats-section">
                    <h2 className="section-header">
                        <Swords size={20} />
                        Ortak Oynanan Maçlar
                    </h2>

                    <div className="comparison-table">
                        {/* Player Headers */}
                        <div className="stat-grid-4 matches-player-headers">
                            {rankedPlayers.map(({ player }) => (
                                <div key={player.puuid} className="stat-cell">
                                    <div className="player-info-column">
                                        <div className="avatar-container">
                                            <img
                                                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${player.profileIconId}.jpg`}
                                                alt={player.name}
                                                className="player-avatar"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/0.jpg' }}
                                            />
                                        </div>
                                        <p className="player-name">{player.name}</p>
                                        <p className="player-tag">#{player.tag}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Matches Grid */}
                        <div className="matches-grid">
                            {commonMatches.slice(0, 20).map((match) => {
                                // Get match details for trait display
                                const matchDetails = rankedPlayers.map(({ player }) => {
                                    const playerMatch = getFilteredMatches(player).find(m => m.matchId === match.matchId);
                                    return {
                                        puuid: player.puuid,
                                        traits: playerMatch?.traits || []
                                    };
                                });

                                return (
                                    <div key={match.matchId} className="match-card">
                                        <div className="match-row">
                                            {rankedPlayers.map(({ player }) => {
                                                const placement = match.placements[player.puuid];

                                                // Player wasn't in this match
                                                if (!placement) {
                                                    return (
                                                        <div key={player.puuid} className="match-cell">
                                                            <div className="match-not-played">
                                                                <span className="not-played-indicator">—</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const points = getPoints(placement);
                                                const playerTraits = matchDetails.find(m => m.puuid === player.puuid)?.traits || [];
                                                const topTraits = playerTraits
                                                    .filter(t => t.tier_current > 0)
                                                    .sort((a, b) => b.style - a.style)
                                                    .slice(0, 2);

                                                return (
                                                    <div key={player.puuid} className="match-cell">
                                                        <div className={`match-placement placement-${placement}`}>
                                                            <span className="placement-number">#{placement}</span>
                                                            <span className="placement-points">{points > 0 ? '+' : ''}{points}pts</span>
                                                            {topTraits.length > 0 && (
                                                                <div className="match-traits">
                                                                    {topTraits.map(t => {
                                                                        const traitName = t.name.replace(/^(Set|TFT|TFTSet)\d+_/, '');
                                                                        // Remove "Unique" suffix
                                                                        const displayName = traitName.replace(/Unique$/, '').split('_').pop() || traitName;
                                                                        return (
                                                                            <span key={t.name} className="match-trait-badge">
                                                                                {displayName}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
