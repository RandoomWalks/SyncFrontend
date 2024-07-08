export interface Change {
    id?: number;
    updatedAt: string;
    type: string;
    position: number;
    clientId: string;
    text?: string;
    length?: number;
    vectorClock: Record<string, number>;
}
