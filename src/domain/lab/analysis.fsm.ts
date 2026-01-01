export type AnalysisStatus =
    | 'pending'     // Queue item created
    | 'started'     // Analyst active on test
    | 'completed'   // Results submitted
    | 'reviewed'    // Peer/Technical check pass
    | 'validated'   // Quality/Final pass
    | 'invalidated'; // Discarded/Retest needed

export const ANALYSIS_TRANSITIONS: Record<AnalysisStatus, AnalysisStatus[]> = {
    'pending': ['started', 'invalidated'],
    'started': ['completed', 'pending', 'invalidated'],
    'completed': ['reviewed', 'validated', 'invalidated', 'started'],
    'reviewed': ['validated', 'invalidated', 'completed'],
    'validated': ['invalidated'], // Terminal but can be invalidated for retest
    'invalidated': ['pending'] // Re-queue
};

export class AnalysisFSM {
    static isValidTransition(from: AnalysisStatus, to: AnalysisStatus): boolean {
        const allowed = ANALYSIS_TRANSITIONS[from] || [];
        return allowed.includes(to);
    }

    static canEdit(status: AnalysisStatus): boolean {
        return ['pending', 'started', 'completed'].includes(status);
    }

    static isFinal(status: AnalysisStatus): boolean {
        return ['validated', 'invalidated'].includes(status);
    }
}
