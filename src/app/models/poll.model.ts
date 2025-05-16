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
}

export interface PollResult {
    optionId: string;
    optionText: string;
    votes: number;
    percentage: number;
}