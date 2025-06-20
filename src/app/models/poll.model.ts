export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  /* core fields */
  id: string;
  title: string;
  description?: string;

  /* answers */
  options: PollOption[];

  /* author & audit */
  createdBy: string;
  createdAt: string;

  /* behaviour switches */
  allowMultiple: boolean;
  isPrivate: boolean;

  /** NEW — can anyone view the results without casting a vote? */
  publicResults?: boolean;

  /* tally */
  totalVotes: number;

  /* schedule (ISO-8601 strings) */
  startDate?: string;
  endDate?: string;

  /* ui-only: has the current user voted?  */
  hasVoted?: boolean;
}

export interface PollResult {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
}
