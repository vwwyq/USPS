import React, { useState } from 'react';
import { useRide } from '../contexts/RideContext';
import { useWallet } from '../contexts/WalletContext';
import { Bike, User, Clock, Plus } from 'lucide-react';

const ScootyRentalPage: React.FC = () => {
  const { availableScooties, myRentals, myListedScooties, listScooty, rentScooty, returnScooty, loading } = useRide();
  const { balance } = useWallet();
  
  const [model, setModel] = useState<string>('');
  const [pricePerHour, setPricePerHour] = useState<string>('');
  const [rentalHours, setRentalHours] = useState<string>('1');
  const [isListing, setIsListing] = useState<boolean>(false);
  const [isRenting, setIsRenting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'rent' | 'my-rentals' | 'my-listings'>('rent');

  const handleListScooty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(pricePerHour);
    
    if (!model || isNaN(price) || price <= 0) {
      setError('Please enter a valid model and price');
      return;
    }
    
    try {
      setIsListing(true);
      setError('');
      await listScooty(model, price);
      setSuccess('Your scooty has been listed for rent');
      setModel('');
      setPricePerHour('');
      setActiveTab('my-listings');
    } catch (error) {
      setError('Failed to list scooty. Please try again.');
      console.error(error);
    } finally {
      setIsListing(false);
    }
  };

  const handleRentScooty = async (scootyId: string) => {
    const hours = parseInt(rentalHours);
    
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid number of hours');
      return;
    }
    
    try {
      setIsRenting(true);
      setError('');
      const success = await rentScooty(scootyId, hours);
      
      if (success) {
        setSuccess('Scooty rented successfully');
        setRentalHours('1');
        setActiveTab('my-rentals');
      } else {
        setError('Failed to rent scooty. Please check your wallet balance.');
      }
    } catch (error) {
      setError('Failed to rent scooty. Please try again.');
      console.error(error);
    } finally {
      setIsRenting(false);
    }
  };

  const handleReturnScooty = async (rentalId: string) => {
    try {
      await returnScooty(rentalId);
      setSuccess('Scooty returned successfully');
    } catch (error) {
      setError('Failed to return scooty. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Scooty Rental</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('rent')}
              className={`${
                activeTab === 'rent'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Rent a Scooty
            </button>
            <button
              onClick={() => setActiveTab('my-rentals')}
              className={`${
                activeTab === 'my-rentals'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              My Rentals
            </button>
            <button
              onClick={() => setActiveTab('my-listings')}
              className={`${
                activeTab === 'my-listings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              My Listings
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'rent' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-800">Available Scooties</h2>
                <button
                  onClick={() => {
                    document.getElementById('list-scooty-form')?.classList.toggle('hidden');
                  }}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  List Your Scooty
                </button>
              </div>
              
              <div id="list-scooty-form" className="bg-gray-50 p-4 rounded-md mb-6 hidden">
                <h3 className="text-md font-medium text-gray-800 mb-3">List Your Scooty for Rent</h3>
                <form onSubmit={handleListScooty} className="space-y-4">
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                      Scooty Model
                    </label>
                    <input
                      type="text"
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., Honda Activa"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Hour (₹)
                    </label>
                    <input
                      type="number"
                      id="pricePerHour"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      min="1"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter hourly rate"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isListing}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isListing ? 'Listing...' : 'List Scooty'}
                    </button>
                  </div>
                </form>
              </div>
              
              {loading ? (
                <p className="text-gray-500">Loading available scooties...</p>
              ) : availableScooties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableScooties.map((scooty) => (
                    <div key={scooty.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Bike className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-800">
                            {scooty.model}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          ₹{scooty.pricePerHour}/hr
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 mr-1" />
                          <span>Owner: {scooty.ownerName}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-3">
                        <div>
                          <label htmlFor={`hours-${scooty.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                            Rent for how many hours?
                          </label>
                          <input
                            type="number"
                            id={`hours-${scooty.id}`}
                            value={rentalHours}
                            onChange={(e) => setRentalHours(e.target.value)}
                            min="1"
                            max="24"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Total: ₹{(scooty.pricePerHour * parseInt(rentalHours || '0')).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRentScooty(scooty.id)}
                            disabled={isRenting || balance < scooty.pricePerHour * parseInt(rentalHours || '0')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {isRenting ? 'Renting...' : 'Rent Now'}
                          </button>
                        </div>
                        
                        {balance < scooty.pricePerHour * parseInt(rentalHours || '0') && (
                          <p className="text-xs text-red-500">Insufficient balance</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No scooties available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no scooties available for rent at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'my-rentals' && (
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">My Rented Scooties</h2>
              
              {loading ? (
                <p className="text-gray-500">Loading your rentals...</p>
              ) : myRentals.length > 0 ? (
                <div className="space-y-4">
                  {myRentals.map((rental) => (
                    <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Bike className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-800">
                            {rental.model}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          ₹{rental.pricePerHour}/hr
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <User className="h-4 w-4 mr-1" />
                          <span>Owner: {rental.ownerName}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            Rented: {rental.rentalStart?.toDate().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            Due: {rental.rentalEnd?.toDate().toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <button
                          onClick={() => handleReturnScooty(rental.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Return Scooty
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No active rentals</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any active scooty rentals.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'my-listings' && (
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">My Listed Scooties</h2>
              
              {loading ? (
                <p className="text-gray-500">Loading your listings...</p>
              ) : myListedScooties.length > 0 ? (
                <div className="space-y-4">
                  {myListedScooties.map((scooty) => (
                    <div key={scooty.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Bike className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-800">
                            {scooty.model}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          ₹{scooty.pricePerHour}/hr
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Status:</span>
                        <span className={`text-sm font-medium ${
                          scooty.status === 'available' 
                            ? 'text-green-600' 
                            : scooty.status === 'rented' 
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                        }`}>
                          {scooty.status.charAt(0).toUpperCase() + scooty.status.slice(1)}
                        </span>
                      </div>
                      
                      {scooty.status === 'rented' && (
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="flex items-center mb-1">
                            <User className="h-4 w-4 mr-1" />
                            <span>Rented by: {scooty.currentRenterName}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              Return due: {scooty.rentalEnd?.toDate().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No listings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't listed any scooties for rent yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScootyRentalPage;