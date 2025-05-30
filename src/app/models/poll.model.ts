export interface PollOption {
    id: string;
    text: string;
}

export interface Poll {
    id: string;
    title: string;
    description?: string;
    options: PollOption[];
    createdBy: string;
    createdAt: string;
    allowMultiple: boolean;
    isPrivate: boolean;
    totalVotes: number;
    startDate?: string // ISO string format
    endDate?: string // ISO string format
}

export interface PollResult {
    optionId: string;
    optionText: string;
    votes: number;
    percentage: number;
}