import { useState } from 'react';
import './App.css';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [activities, setActivities] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [maxBudget, setMaxBudget] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Sending request with activities:', activities);

      const response = await axios.post(
        `${API_URL}/api/recommendations`,
        { preferred_activities: activities, max_budget: maxBudget },
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      if (response.data.matches) {
        console.log('Matches found:', response.data.matches);
        setRecommendations(response.data.matches);
      } else {
        console.log(
          'No matches property in response:',
          response.data
        );
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(
        err.response?.data?.error || 'Failed to fetch recommendations'
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto space-y-6 sm:space-y-8'>
        <header className='text-center'>
          <h1
            className='text-2xl sm:text-3xl font-bold text-gray-100'
            tabIndex='0'
          >
            Travel Recommendations
          </h1>
          <p
            className='mt-2 text-sm sm:text-base text-gray-400'
            tabIndex='0'
          >
            Find travel profiles matching your interests
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className='bg-gray-800 shadow-lg ring-1 ring-gray-700 rounded-lg p-4 sm:p-6'
          aria-label='Travel preferences form'
        >
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='activities'
                className='block text-sm font-medium text-gray-300'
              >
                What activities do you enjoy?
                <span
                  className='text-red-500 ml-1'
                  aria-hidden='true'
                >
                  *
                </span>
              </label>
              <textarea
                id='activities'
                name='activities'
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                className='mt-1 block w-full rounded-md bg-gray-700 border-gray-600 
                         text-gray-100 placeholder-gray-500
                         focus:border-indigo-500 focus:ring-indigo-500 
                         text-base sm:text-sm'
                placeholder='e.g., hiking, swimming, skiing'
                rows={3}
                required
                aria-required='true'
                aria-describedby='activities-hint'
              />
              <p
                id='activities-hint'
                className='mt-1 text-xs text-gray-500'
              >
                Enter one or more activities you enjoy while traveling
              </p>
            </div>

            <div>
              <label
                htmlFor='maxBudget'
                className='block text-sm font-medium text-gray-300'
              >
                Maximum Budget
              </label>
              <input
                type='number'
                id='maxBudget'
                name='maxBudget'
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className='mt-1 block w-full rounded-md bg-gray-700 border-gray-600 
                         text-gray-100 placeholder-gray-500
                         focus:border-indigo-500 focus:ring-indigo-500 
                         text-base sm:text-sm'
                placeholder='e.g., 5000'
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full flex justify-center py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white 
                       bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                       focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200'
              aria-label={
                loading
                  ? 'Finding matches...'
                  : 'Get travel recommendations'
              }
            >
              {loading ? (
                <>
                  <span className='sr-only'>Finding matches...</span>
                  <svg
                    className='animate-spin h-5 w-5 mr-2'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Finding matches...
                </>
              ) : (
                'Get Recommendations'
              )}
            </button>
            {loading && (
              <div className='mt-2'>
                <div className='h-2 bg-gray-700 rounded'>
                  <div
                    className='h-2 bg-indigo-600 rounded transition-all duration-300'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className='text-sm text-gray-400 mt-1'>
                  Loading... {progress}%
                </p>
              </div>
            )}
          </div>
        </form>

        {error && (
          <div
            className='rounded-md bg-red-50 p-4'
            role='alert'
            aria-live='polite'
          >
            <div className='text-sm text-red-700'>{error}</div>
          </div>
        )}

        {recommendations.length > 0 && (
          <section className='space-y-4 sm:space-y-6'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-100'>
              Similar Travel Profiles
            </h2>
            <div className='grid gap-4 sm:gap-6 sm:grid-cols-2'>
              {recommendations.map((rec) => (
                <article
                  key={rec.id}
                  className='bg-gray-800 shadow-lg ring-1 ring-gray-700 rounded-lg p-4 
                           hover:bg-gray-750 transition-colors duration-200'
                >
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium text-gray-100'>
                        Match Score: {rec.match_percentage.toFixed(1)}
                        %
                      </h3>
                    </div>
                    <dl className='grid gap-x-4 gap-y-2 grid-cols-2 text-sm'>
                      <div className='col-span-2'>
                        <dt className='text-gray-400'>Activities</dt>
                        <dd className='mt-1 text-gray-200'>
                          {rec.preferred_activities}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-gray-400'>Age</dt>
                        <dd className='mt-1 text-gray-200'>
                          {rec.age}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-gray-400'>Location</dt>
                        <dd className='mt-1 text-gray-200'>
                          {rec.location}
                        </dd>
                      </div>
                      <div className='col-span-2'>
                        <dt className='text-gray-400'>
                          Vacation Budget
                        </dt>
                        <dd className='mt-1 text-gray-200'>
                          $
                          {rec.vacation_budget?.toLocaleString() ??
                            'Not specified'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
