const API_KEY = process.env.RIOT_API_KEY;
const REGION = process.env.NEXT_PUBLIC_REGION || 'tr1';
const EUROPE_REGION = 'europe'; // Account/Match V1 use routing values like 'europe', 'americas'

const BASE_URL_PLATFORM = `https://${REGION}.api.riotgames.com`;
const BASE_URL_REGIONAL = `https://${EUROPE_REGION}.api.riotgames.com`;

export class RiotApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function fetchRiot(url: string) {
    if (!API_KEY) throw new Error("RIOT_API_KEY not configured");

    // Simple rate limiting: wait 100ms between requests if needed, but for now direct fetch
    // Production would need a real queue.
    // We'll rely on response headers or 429 later.

    const res = await fetch(url, {
        headers: {
            "X-Riot-Token": API_KEY,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
        throw new RiotApiError(`Riot API Failed: ${res.status} ${res.statusText} for URL: ${url}`, res.status);
    }

    return res.json();
}

export async function getAccountByRiotId(gameName: string, tagLine: string) {
    const url = `${BASE_URL_REGIONAL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return fetchRiot(url);
}

export async function getSummonerByPuuid(puuid: string) {
    // Try TFT endpoint first, then LoL if needed, or just use LoL V4 as it's standard for Summoner ID
    // Updating to use LoL V4 as TFT endpoint seemed to miss 'id' in some cases or regions
    const url = `${BASE_URL_PLATFORM}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return fetchRiot(url);
}

export async function getLeagueEntries(summonerId: string) {
    const url = `${BASE_URL_PLATFORM}/tft/league/v1/entries/by-summoner/${summonerId}`;
    return fetchRiot(url);
}

export async function getMatchIds(puuid: string, count: number = 20) {
    const url = `${BASE_URL_REGIONAL}/tft/match/v1/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    return fetchRiot(url);
}

export async function getMatchDetails(matchId: string) {
    const url = `${BASE_URL_REGIONAL}/tft/match/v1/matches/${matchId}`;
    return fetchRiot(url);
}
