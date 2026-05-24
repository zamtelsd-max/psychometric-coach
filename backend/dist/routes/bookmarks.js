"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /bookmarks
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const bookmarks = await prisma_1.default.bookmark.findMany({
            where: { userId: req.user.id },
            include: {
                question: {
                    include: { category: { select: { name: true, slug: true, icon: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(bookmarks);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});
// POST /bookmarks
router.post('/', auth_1.authenticate, [(0, express_validator_1.body)('questionId').notEmpty()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { questionId, note } = req.body;
    try {
        const bookmark = await prisma_1.default.bookmark.upsert({
            where: { userId_questionId: { userId: req.user.id, questionId } },
            create: { userId: req.user.id, questionId, note: note ?? null },
            update: { note: note ?? null },
        });
        res.status(201).json(bookmark);
    }
    catch {
        res.status(500).json({ error: 'Failed to create bookmark' });
    }
});
// DELETE /bookmarks/:questionId
router.delete('/:questionId', auth_1.authenticate, async (req, res) => {
    try {
        await prisma_1.default.bookmark.deleteMany({
            where: { userId: req.user.id, questionId: req.params.questionId },
        });
        res.json({ message: 'Bookmark removed' });
    }
    catch {
        res.status(500).json({ error: 'Failed to delete bookmark' });
    }
});
exports.default = router;
//# sourceMappingURL=bookmarks.js.map