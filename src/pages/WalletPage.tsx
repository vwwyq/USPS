import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

const WalletPage: React.FC = () => {
  const { balance, transactions, topUp, loading } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topUpAmount = parseFloat(amount);
    
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      await topUp(topUpAmount);
      setSuccess(`Successfully added ₹${topUpAmount.toFixed(2)} to your wallet`);
      setAmount('');
    } catch (error) {
      setError('Failed to top up wallet. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-semibold">₹{balance.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Transaction History</h2>
              
              {loading ? (
                <p className="text-gray-500">Loading transactions...</p>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="py-3 flex items-center">
                      <div className="p-2 rounded-full bg-gray-100 mr-3">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.timestamp.toDate().toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'topup' || transaction.type === 'refund' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'topup' || transaction.type === 'refund' ? '+' : '-'}
                        ₹{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Top Up Wallet</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          
          <form onSubmit={handleTopUp}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                defaultValue="upi"
              >
                <option value="upi">UPI</option>
                <option value="card">Credit/Debit Card</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Top Up'}
            </button>
          </form>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Add</h3>
            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 500].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;