import ExpenseRequest from '../models/ExpenseRequest.js';

export const getAllExpenseRequests = async (req, res) => {
  try {
    if (req.user.role !== 'budget' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await ExpenseRequest.find()
      .populate('employeeId', 'fullName email') // מציג מידע על העובד
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
