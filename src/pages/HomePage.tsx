import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, Car, Bike, ShoppingBag } from 'lucide-react';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { balance, transactions } = useWallet();
  
  // Get recent transactions (last 3)
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {currentUser?.email}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Wallet Balance</p>
              <p className="text-xl font-semibold">₹{balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/wallet"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Top up wallet →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <Car className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ride Sharing</p>
              <p className="text-xl font-semibold">Find a ride</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/rides"
              className="text-sm text-green-600 hover:text-green-800"
            >
              Request or offer a ride →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <Bike className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scooty Rental</p>
              <p className="text-xl font-semibold">Rent or list</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/scooty"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Explore scooty rentals →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
          <Link
            to="/wallet"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            View all
          </Link>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="py-3 flex items-center">
                <div className="p-2 rounded-full bg-gray-100 mr-3">
                  <ShoppingBag className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.timestamp.toDate().toLocaleString()}
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  transaction.type === 'topup' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'topup' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recent transactions</p>
        )}
      </div>
      
      <div className="bg-indigo-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-indigo-800 mb-2">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-indigo-700">
          <li>• Top up your wallet to make quick payments at university stores</li>
          <li>• Offer rides to fellow students to build your trust score</li>
          <li>• List your scooty for rent when you're not using it</li>
          <li>• Check your transaction history regularly</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;