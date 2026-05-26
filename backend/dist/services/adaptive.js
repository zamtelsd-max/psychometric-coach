"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdaptiveQuestions = getAdaptiveQuestions;
exports.updateReadinessScore = updateReadinessScore;
exports.detectWeaknesses = detectWeaknesses;
exports.generateStudyPlan = generateStudyPlan;
exports.calculatePercentile = calculatePercentile;
const prisma_1 = __importDefault(require("../lib/prisma"));
// IRT (Item Response Theory) based difficulty targeting
const ABILITY_ESTIMATE_RANGE = { min: -3, max: 3 };
const AVOID_RECENT_DAYS = 45;
const DEFAULT_ABILITY = 0; // corresponds to difficulty ~5 on 1-10 scale
function difficultyToIRT(difficulty) {
    // Map 1-10 scale to IRT b-parameter (-3 to 3)
    return ((difficulty - 5.5) / 4.5) * 3;
}
function estimateAbility(recentAttempts) {
    if (recentAttempts.length === 0)
        return DEFAULT_ABILITY;
    let ability = DEFAULT_ABILITY;
    const LEARNING_RATE = 0.3;
    for (const attempt of recentAttempts) {
        const b = difficultyToIRT(attempt.question.difficulty);
        const p = 1 / (1 + Math.exp(-(ability - b)));
        const response = attempt.isCorrect ? 1 : 0;
        ability += LEARNING_RATE * (response - p);
        ability = Math.max(ABILITY_ESTIMATE_RANGE.min, Math.min(ABILITY_ESTIMATE_RANGE.max, ability));
    }
    return ability;
}
async function getAdaptiveQuestions(userId, categoryId, count, mode = 'PRACTICE') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AVOID_RECENT_DAYS);
    // Run both attempt queries in parallel to halve latency
    const [recentAttempts, abilityAttempts] = await Promise.all([
        prisma_1.default.attempt.findMany({
            where: { userId, createdAt: { gte: cutoffDate } },
            select: { questionId: true },
        }),
        prisma_1.default.attempt.findMany({
            where: { userId, ...(categoryId ? { question: { categoryId } } : {}) },
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { isCorrect: true, question: { select: { difficulty: true } } },
        }),
    ]);
    const recentIds = recentAttempts.map((a) => a.questionId);
    const ability = estimateAbility(abilityAttempts);
    const targetDifficulty = Math.round(((ability + 3) / 6) * 9 + 1);
    const diffLow = Math.max(1, targetDifficulty - 2);
    const diffHigh = Math.min(10, targetDifficulty + 2);
    // Fetch questions at target difficulty, not recently seen
    const questions = await prisma_1.default.question.findMany({
        where: {
            isActive: true,
            ...(categoryId ? { categoryId } : {}),
            ...(recentIds.length > 0 ? { id: { notIn: recentIds } } : {}),
            difficulty: { gte: diffLow, lte: diffHigh },
        },
        take: count * 3,
        select: { id: true },
    });
    // If not enough, fill with any remaining questions from this category
    if (questions.length < count) {
        const seenIds = [...recentIds, ...questions.map((q) => q.id)];
        const fallback = await prisma_1.default.question.findMany({
            where: {
                isActive: true,
                ...(categoryId ? { categoryId } : {}),
                ...(seenIds.length > 0 ? { id: { notIn: seenIds } } : {}),
            },
            take: count - questions.length,
            select: { id: true },
        });
        questions.push(...fallback);
    }
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((q) => q.id);
}
async function updateReadinessScore(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attempts = await prisma_1.default.attempt.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        include: { question: { select: { timeLimit: true, difficulty: true } } },
        orderBy: { createdAt: 'desc' },
    });
    if (attempts.length === 0) {
        return 0;
    }
    // Accuracy component (0-1)
    const accuracy = attempts.filter((a) => a.isCorrect).length / attempts.length;
    // Speed factor (0-1) — ratio of attempts completed within time limit
    const speedFactor = attempts.filter((a) => a.timeTaken <= a.question.timeLimit).length / attempts.length;
    // Consistency (0-1) — based on recency spread
    const attemptsByDay = new Map();
    for (const a of attempts) {
        const day = a.createdAt.toISOString().split('T')[0];
        attemptsByDay.set(day, (attemptsByDay.get(day) || 0) + 1);
    }
    const activeDays = attemptsByDay.size;
    const consistency = Math.min(1, activeDays / 20); // 20+ active days = full consistency
    const readinessScore = Math.round((accuracy * 0.5 + speedFactor * 0.25 + consistency * 0.25) * 100);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { readinessScore },
    });
    return readinessScore;
}
async function detectWeaknesses(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attempts = await prisma_1.default.attempt.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        include: {
            question: {
                select: { subSkill: true, categoryId: true, category: { select: { name: true } } },
            },
        },
    });
    // Group by subSkill
    const skillMap = new Map();
    for (const a of attempts) {
        const key = `${a.question.categoryId}::${a.question.subSkill}`;
        if (!skillMap.has(key)) {
            skillMap.set(key, {
                correct: 0,
                total: 0,
                categoryId: a.question.categoryId,
                categoryName: a.question.category.name,
                subSkill: a.question.subSkill,
            });
        }
        const entry = skillMap.get(key);
        entry.total += 1;
        if (a.isCorrect)
            entry.correct += 1;
    }
    const weaknesses = Array.from(skillMap.values())
        .filter((s) => s.total >= 3 && s.correct / s.total < 0.6)
        .map((s) => ({
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        subSkill: s.subSkill,
        accuracy: s.correct / s.total,
    }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10);
    return weaknesses;
}
async function generateStudyPlan(userId) {
    const weaknesses = await detectWeaknesses(userId);
    const categories = await prisma_1.default.category.findMany({ select: { id: true, name: true, slug: true } });
    const tasks = [];
    // Add weak area tasks first
    for (const w of weaknesses.slice(0, 3)) {
        tasks.push({
            type: 'practice',
            categoryId: w.categoryId,
            categoryName: w.categoryName,
            subSkill: w.subSkill,
            questionCount: 10,
            label: `Improve ${w.subSkill}`,
            priority: 'high',
            accuracy: w.accuracy,
        });
    }
    // Fill remaining with varied categories
    const usedCategoryIds = weaknesses.slice(0, 3).map((w) => w.categoryId);
    const remainingCats = categories.filter((c) => !usedCategoryIds.includes(c.id));
    const shuffled = remainingCats.sort(() => Math.random() - 0.5);
    for (const cat of shuffled.slice(0, 5 - tasks.length)) {
        tasks.push({
            type: 'practice',
            categoryId: cat.id,
            categoryName: cat.name,
            subSkill: null,
            questionCount: 8,
            label: `Practice ${cat.name}`,
            priority: 'medium',
        });
    }
    // Save to DB
    await prisma_1.default.studyPlan.upsert({
        where: { userId },
        create: { userId, plan: tasks },
        update: { plan: tasks },
    });
    return tasks;
}
async function calculatePercentile(score, categoryIds) {
    // Get all historical mock exam scores for these categories
    const exams = await prisma_1.default.mockExam.findMany({
        where: {
            completedAt: { not: null },
            score: { not: null },
        },
        select: { score: true },
    });
    if (exams.length === 0)
        return 50;
    const scores = exams.map((e) => e.score).sort((a, b) => a - b);
    const below = scores.filter((s) => s < score).length;
    return Math.round((below / scores.length) * 100);
}
//# sourceMappingURL=adaptive.js.map