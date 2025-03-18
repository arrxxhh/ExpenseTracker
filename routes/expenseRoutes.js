const express = require("express");
const Expense = require("../models/Expense");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Create an expense
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ message: "Amount, category, and date are required" });
    }

    const expense = new Expense({
      user: req.user,
      amount,
      category,
      date,
      description,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all expenses (Paginated, Filtered)
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { user: req.user };

    if (category) query.category = category;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update an expense
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized to update this expense" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an expense
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized to delete this expense" });
    }

    await expense.remove();
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
