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

                // 2. Get Summoner (for profile icon only, no rank)
                const summoner = await getSummonerByPuuid(puuid);

                // 3. Get Matches
                const matchIds = await getMatchIds(puuid, 20);

                // 4. Get Match Details
                const matches: MatchResult[] = [];
                for (const mid of matchIds) {
                    const details = await getMatchDetails(mid);
                    const participant = details.info.participants.find((par: any) => par.puuid === puuid);

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
                    summonerId: summoner.id || '',
                    profileIconId: summoner.profileIconId || 0,
                    rank: null,
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
