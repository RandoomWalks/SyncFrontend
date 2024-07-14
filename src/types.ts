export interface Change {
    id?: string; // Changed to string to match the composite key format
    updatedAt: string;
    type: string;
    position: number;
    clientId: string;
    text?: string;
    length?: number;
    vectorClock: { [clientId: string]: number };
}

export interface VectorClock {
    [clientId: string]: number;
}

export interface ChangeDto {
    type: "insert" | "delete";
    position: number;
    vectorClock: VectorClock;
    clientId: string;
    text?: string;
    length?: number;
    updatedAt?: string; // ISO 8601 string
}

export function convertChangeDtoToChange(dto: ChangeDto): Change {
    return {
        id: `${dto.clientId}-${dto.updatedAt || new Date().toISOString()}`,
        updatedAt: dto.updatedAt || new Date().toISOString(),
        type: dto.type,
        position: dto.position,
        clientId: dto.clientId,
        text: dto.text,
        length: dto.length,
        vectorClock: { ...dto.vectorClock }
    };
}

export function mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
    const merged: VectorClock = { ...vc1 };
    for (const clientId in vc2) {
        merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId]);
    }
    return merged;
}

export function compareVectorClocks(vc1: VectorClock, vc2: VectorClock): number {
    let isLess = false;
    let isGreater = false;

    for (const clientId in vc1) {
        if (!(clientId in vc2) || vc1[clientId] > vc2[clientId]) {
            isGreater = true;
        } else if (vc1[clientId] < vc2[clientId]) {
            isLess = true;
        }
    }

    for (const clientId in vc2) {
        if (!(clientId in vc1)) {
            isLess = true;
        }
    }

    if (isGreater && isLess) return 0; // Concurrent
    if (isGreater) return 1;
    if (isLess) return -1;
    return 0; // Equal
}