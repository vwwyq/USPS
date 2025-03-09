import React, { useState } from 'react';
import { useRide } from '../contexts/RideContext';
import { Car, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

const RidesPage: React.FC = () => {
  const { rideRequests, myRides, requestRide, offerRide, completeRide, loading } = useRide();
  
  const [pickup, setPickup] = useState<string>('');
  const [dropoff, setDropoff] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'request' | 'offer' | 'my-rides'>('request');

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickup || !dropoff) {
      setError('Please enter pickup and drop-off locations');
      return;
    }
    
    try {
      setIsRequesting(true);
      setError('');
      await requestRide(pickup, dropoff);
      setSuccess('Ride request submitted successfully');
      setPickup('');
      setDropoff('');
      setActiveTab('my-rides');
    } catch (error) {
      setError('Failed to request ride. Please try again.');
      console.error(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOfferRide = async (requestId: string) => {
    try {
      await offerRide(requestId);
      setSuccess('You have offered to drive for this ride');
    } catch (error) {
      setError('Failed to offer ride. Please try again.');
      console.error(error);
    }
  };

  const handleCompleteRide = async (requestId: string) => {
    try {
      await completeRide(requestId);
      setSuccess('Ride marked as completed');
    } catch (error) {
      setError('Failed to complete ride. Please try again.');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'accepted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Accepted</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ride Sharing</h1>
      
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
              onClick={() => setActiveTab('request')}
              className={`${
                activeTab === 'request'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Request a Ride
            </button>
            <button
              onClick={() => setActiveTab('offer')}
              className={`${
                activeTab === 'offer'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Offer a Ride
            </button>
            <button
              onClick={() => setActiveTab('my-rides')}
              className={`${
                activeTab === 'my-rides'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
            >
              My Rides
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'request' && (
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Request a Ride</h2>
              <form onSubmit={handleRequestRide}>
                <div className="mb-4">
                  <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="pickup"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter pickup location"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700 mb-1">
                    Drop-off Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="dropoff"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter drop-off location"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isRequesting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isRequesting ? 'Requesting...' : 'Request Ride'}
                </button>
              </form>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  By requesting a ride, you agree to our terms and conditions. All rides are volunteer-based and free of charge.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'offer' && (
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Available Ride Requests</h2>
              
              {loading ? (
                <p className="text-gray-500">Loading ride requests...</p>
              ) : rideRequests.length > 0 ? (
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{request.riderName}</p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>From: {request.pickup}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>To: {request.dropoff}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {request.timestamp.toDate().toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOfferRide(request.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Offer Ride
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No ride requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no pending ride requests at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'my-rides' && (
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-4">My Rides</h2>
              
              {loading ? (
                <p className="text-gray-500">Loading your rides...</p>
              ) : myRides.length > 0 ? (
                <div className="space-y-4">
                  {myRides.map((ride) => (
                    <div key={ride.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-800">
                            {ride.pickup} → {ride.dropoff}
                          </span>
                        </div>
                        {getStatusBadge(ride.status)}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        {ride.driverId ? (
                          <p>Driver: {ride.driverName}</p>
                        ) : (
                          <p>Waiting for a driver</p>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-500">
                        <p>Requested: {ride.timestamp.toDate().toLocaleString()}</p>
                      </div>
                      
                      {ride.status === 'accepted' && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleCompleteRide(ride.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No rides yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't requested or offered any rides yet.
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

export default RidesPage;