import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { addJobToNotion } from './lib/notion'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Load realtime updates from Supabase
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase.from('jobs').select('*').order('applied', { ascending: false })
        if (error) throw error
        setJobs(data || [])
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Check for new jobs from browser extension
    const checkForNewJobs = () => {
      const newJob = localStorage.getItem('newJob')
      const newJobTimestamp = localStorage.getItem('newJobTimestamp')
      
      if (newJob && newJobTimestamp) {
        console.log('🔄 New job detected from browser extension')
        const job = JSON.parse(newJob)
        const timestamp = parseInt(newJobTimestamp)
        const now = Date.now()
        
        // Only process if the job is from the last 5 minutes (to avoid duplicates)
        if (now - timestamp < 5 * 60 * 1000) {
          console.log('📝 Processing job:', job.title, 'at', job.company)
          
          // Add to both Supabase and Notion
          const addJobToBoth = async () => {
            try {
              console.log('💾 Adding to Supabase...')
              const { data, error } = await supabase
                .from('jobs')
                .insert([job])
                .select()
                .single()
              
              if (error) throw error
              console.log('✅ Job added to Supabase:', data.id)
              
              // Update local state
              setJobs(prev => [data, ...prev])
              setLastUpdate(new Date())
              
              // Try to add to Notion
              try {
                console.log('📋 Adding to Notion...')
                const notionResult = await addJobToNotion(data)
                if (notionResult.success) {
                  console.log('✅ Job added to both Supabase and Notion')
                } else {
                  console.log('⚠️ Job added to Supabase, but Notion sync failed:', notionResult.message)
                }
              } catch (notionError) {
                console.error('❌ Notion sync failed:', notionError)
              }
              
              // Clear the localStorage
              localStorage.removeItem('newJob')
              localStorage.removeItem('newJobTimestamp')
              console.log('🧹 Cleared localStorage')
            } catch (error) {
              console.error('❌ Error adding job:', error)
            }
          }
          
          addJobToBoth()
        } else {
          console.log('⏰ Job too old, ignoring')
          // Clear old jobs
          localStorage.removeItem('newJob')
          localStorage.removeItem('newJobTimestamp')
        }
      }
    }

    // Check immediately
    checkForNewJobs()

    // Check every 2 seconds for new jobs
    const interval = setInterval(checkForNewJobs, 2000)

    // Set up real-time subscription
    const subscription = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // Manual refresh function
  const refreshJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('applied', { ascending: false })
      if (error) throw error
      setJobs(data || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing jobs:', error)
    } finally {
      setLoading(false)
    }
  }


  const stats = {
    total: jobs.length,
    thisWeek: jobs.filter(job => {
      const jobDate = new Date(job.applied)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return jobDate >= weekAgo
    }).length,
    thisMonth: jobs.filter(job => {
      const jobDate = new Date(job.applied)
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      return jobDate >= monthAgo
    }).length
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">🚀</h1>
            <h2 className="text-4xl font-bold text-white mb-4">Job Tracker</h2>
            <p className="text-xl text-gray-300 mb-8">
              Track your job applications automatically with our browser extension
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">How it works:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center text-gray-300">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                Install the browser extension
              </div>
              <div className="flex items-center text-gray-300">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                Click "Apply" on any job posting
              </div>
              <div className="flex items-center text-gray-300">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                Job gets automatically tracked here
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowWelcome(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold">Job Tracker</h1>
              <p className="text-gray-400">Track your job applications automatically</p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshJobs}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold">{stats.thisWeek}</div>
                <div className="text-sm text-gray-400">This Week</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
                <div className="text-sm text-gray-400">This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading applications...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
              <p className="text-gray-400 mb-6">Start applying to jobs and they'll appear here automatically!</p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-semibold mb-2">💡 Pro Tip:</h4>
                <p className="text-sm text-gray-300">
                  Install our browser extension to automatically track job applications from any job site.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {jobs.map((job, idx) => (
                    <tr key={idx} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{job.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{job.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(job.applied).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Applied
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Job →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}