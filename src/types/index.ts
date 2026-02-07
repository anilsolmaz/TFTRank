export interface Rank {
    tier: string;
    rank: string;
    leaguePoints: number;
}

export interface Player {
    name: string;
    tag: string;
    puuid: string;
    summonerId: string;
    profileIconId: number;
    rank: Rank | null;
    recentMatches: MatchResult[];
}

export interface MatchResult {
    matchId: string;
    placement: number;
    traits: Trait[];
    units: Unit[];
    gameDetail: {
        game_datetime: number;
        game_length: number;
        game_version: string;
    };
}

export interface Trait {
    name: string;
    num_units: number;
    tier_current: number;
    style: number; // 0=None, 1=Bronze, 2=Silver, 3=Gold, 4=mChromatic
}

export interface Unit {
    character_id: string;
    tier: number; // Star level
    itemNames: string[];
}
