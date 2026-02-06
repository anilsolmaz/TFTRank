import { NextResponse } from 'next/server';
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntries, getMatchIds, getMatchDetails } from '@/lib/riotApi';
import { Player, MatchResult } from '@/types';

export const dynamic = 'force-dynamic';

// Hardcoded players from prompt as default if not provided
const DEFAULT_PLAYERS = [
    { name: 'azeotrop', tag: 'TR1' },
    { name: 'JitanX', tag: 'TR1' },
    { name: 'AAykut', tag: 'TR1' },
    { name: 'Atìì', tag: '3233' },
];

export async function GET() {
    try {
        const playersData: Player[] = [];

        for (const p of DEFAULT_PLAYERS) {
            try {
                // 1. Get Account (PUUID)
                const account = await getAccountByRiotId(p.name, p.tag);
                const puuid = account.puuid;

                // 2. Get Summoner (for Icon + ID)
                const summoner = await getSummonerByPuuid(puuid);

                // 3. Get League (Rank)
                let tftRank = null;
                if (summoner.id) {
                    try {
                        const leagueEntries = await getLeagueEntries(summoner.id);
                        tftRank = leagueEntries.find((e: any) => e.queueType === 'RANKED_TFT') || null;
                    } catch (err) {
                        console.warn(`Failed to fetch league entries for ${p.name}`, err);
                    }
                } else {
                    console.warn(`Summoner ID missing for ${p.name}, skipping rank lookup.`);
                }

                // 4. Get Matches
                const matchIds = await getMatchIds(puuid, 20);

                // 5. Get Match Details (Parallel)
                // Note: Free tier key has 20 requests/1sec and 100/2min.
                // Fetching 20 matches for 4 players = 80 requests. This will hit rate limits.
                // We should fetch fewer matches or do it sequentially with delays.
                // For prototype, let's fetch last 5 matches full details, and just placement for others if possible?
                // Actually, match history endpoint only gives IDs. We need details for placement.
                // Let's limit to last 10 games for now or add delay.

                // To avoid complexity, let's fetch last 20 matches as requested.
                const recentMatchIds = matchIds.slice(0, 20);

                const matches: MatchResult[] = [];
                for (const mid of recentMatchIds) {
                    const details = await getMatchDetails(mid);
                    // Find this player's participant data
                    const participant = details.info.participants.find((part: any) => part.puuid === puuid);

                    if (participant) {
                        matches.push({
                            matchId: mid,
                            placement: participant.placement,
                            traits: participant.traits,
                            units: participant.units,
                            gameDetail: {
                                game_datetime: details.info.game_datetime,
                                game_length: details.info.game_length,
                                game_version: details.info.game_version
                            }
                        });
                    }
                    // Small delay to be nice to API
                    await new Promise(r => setTimeout(r, 10));
                }

                playersData.push({
                    name: account.gameName,
                    tag: account.tagLine,
                    puuid: puuid,
                    summonerId: summoner.id,
                    profileIconId: summoner.profileIconId,
                    rank: tftRank ? {
                        tier: tftRank.tier,
                        rank: tftRank.rank,
                        leaguePoints: tftRank.leaguePoints
                    } : null,
                    recentMatches: matches
                });

            } catch (error) {
                console.error(`Error fetching data for ${p.name}:`, error);
                // Continue to next player
            }
        }

        return NextResponse.json(playersData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
