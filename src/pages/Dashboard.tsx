import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export default function Dashboard() {
  const { supabase, signOut, session } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session?.id) {
      setError('You must be logged in to add expenses');
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          user_id: session.id,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description,
          date: new Date().toISOString()
        }]);

      if (error) throw error;

      setShowAddExpense(false);
      setNewExpense({ amount: '', category: '', description: '' });
      await fetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense');
    }
  };

  const chartData = {
    labels: expenses.map(expense => new Date(expense.date).toLocaleDateString()),
    datasets: [{
      label: 'Expenses',
      data: expenses.map(expense => expense.amount),
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Tracker</h1>
          <button
            onClick={() => signOut()}
            className="flex items-center px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Expense Overview</h2>
            <Line data={chartData} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </button>
            </div>

            {showAddExpense && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
                onSubmit={handleAddExpense}
              >
                <div className="space-y-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            <div className="space-y-4">
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 border rounded-lg dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{expense.category}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{expense.description}</p>
                    </div>
                    <p className="font-bold text-primary-600 dark:text-primary-400">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}