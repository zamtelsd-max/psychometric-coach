export declare function getAdaptiveQuestions(userId: string, categoryId: string | undefined, count: number, mode?: string): Promise<string[]>;
export declare function updateReadinessScore(userId: string): Promise<number>;
export declare function detectWeaknesses(userId: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    subSkill: string;
    accuracy: number;
}>>;
export declare function generateStudyPlan(userId: string): Promise<object[]>;
export declare function calculatePercentile(score: number, categoryIds: string[]): Promise<number>;
//# sourceMappingURL=adaptive.d.ts.map