export type SampleStatus =
    | 'draft'          // Initial entry, not yet active
    | 'registered'     // Ready for collection
    | 'collected'      // Physical sample taken
    | 'in_analysis'    // Analytical work in progress
    | 'under_review'   // All results entered, awaiting approval
    | 'approved'       // Technical pass
    | 'rejected'       // Technical fail
    | 'released'       // Officially released for production/customer
    | 'archived';      // Record locked and stored

export const SAMPLE_TRANSITIONS: Record<SampleStatus, SampleStatus[]> = {
    'draft': ['registered'],
    'registered': ['collected', 'draft'],
    'collected': ['in_analysis', 'registered'],
    'in_analysis': ['under_review', 'collected'],
    'under_review': ['approved', 'rejected', 'in_analysis'],
    'approved': ['released', 'under_review', 'rejected'],
    'rejected': ['in_analysis', 'under_review'],
    'released': ['archived'],
    'archived': [] // Terminal state
};

/**
 * Sample State Machine Validator
 */
export class SampleFSM {
    static isValidTransition(from: SampleStatus, to: SampleStatus): boolean {
        const allowed = SAMPLE_TRANSITIONS[from] || [];
        return allowed.includes(to);
    }

    static canApprove(status: SampleStatus): boolean {
        return status === 'under_review';
    }

    /**
     * Business Logic: Can this sample transition to 'under_review'?
     * Requires all analytical parameters to be completed.
     */
    static isReadyForReview(completedCount: number, totalCount: number): boolean {
        return totalCount > 0 && completedCount === totalCount;
    }

    /**
     * Business Logic: Is the sample compliant for automatic release?
     * If there are non-conformities, human intervention (reason/CAPA) is mandatory.
     */
    static isCompliant(results: { is_conforming: boolean | null }[]): boolean {
        return results.every(r => r.is_conforming === true);
    }

    static canEditResults(status: SampleStatus): boolean {
        return ['collected', 'in_analysis', 'under_review'].includes(status);
    }
}
