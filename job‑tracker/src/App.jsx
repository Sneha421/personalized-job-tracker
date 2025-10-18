import { useState, useEffect } from 'react'
import { addJobToNotion } from './lib/notion'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Load jobs from localStorage
  useEffect(() => {
    console.log('🚀 React app loaded!')
    console.log('🔍 Checking for existing jobs in localStorage...')
    
    const loadJobsFromStorage = () => {
      try {
        const storedJobs = localStorage.getItem('jobTrackerJobs')
        if (storedJobs) {
          const jobs = JSON.parse(storedJobs)
          setJobs(jobs)
          console.log('📋 Loaded jobs from localStorage:', jobs.length)
        } else {
          setJobs([])
          console.log('📋 No jobs found in localStorage')
        }
      } catch (error) {
        console.error('Error loading jobs from localStorage:', error)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    loadJobsFromStorage()

    // Check for new jobs from browser extension
    const checkForNewJobs = () => {
      console.log('🔍 Checking for new jobs...')
      const newJob = localStorage.getItem('newJob')
      const newJobTimestamp = localStorage.getItem('newJobTimestamp')
      console.log('🔍 newJob:', newJob)
      console.log('🔍 newJobTimestamp:', newJobTimestamp)
      
      if (newJob && newJobTimestamp) {
        console.log('🔄 New job detected from browser extension')
        const job = JSON.parse(newJob)
        const timestamp = parseInt(newJobTimestamp)
        const now = Date.now()
        
        // Only process if the job is from the last 5 minutes (to avoid duplicates)
        if (now - timestamp < 5 * 60 * 1000) {
          console.log('📝 Processing job:', job.title, 'at', job.company)
          
          // Add job to localStorage
          const addJobToStorage = async () => {
            try {
              console.log('💾 Adding job to localStorage...')
              
              // Add unique ID to job
              const jobWithId = {
                ...job,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
              }
              
              // Get existing jobs from localStorage
              const existingJobs = JSON.parse(localStorage.getItem('jobTrackerJobs') || '[]')
              
              // Add new job to the beginning
              const updatedJobs = [jobWithId, ...existingJobs]
              
              // Save to localStorage
              localStorage.setItem('jobTrackerJobs', JSON.stringify(updatedJobs))
              
              // Update local state
              setJobs(updatedJobs)
              setLastUpdate(new Date())
              
              console.log('✅ Job added to localStorage:', jobWithId.title, 'at', jobWithId.company)
              
              // Sync to Notion
              try {
                console.log('📋 Syncing to Notion...')
                console.log('📋 Job data being sent to Notion:', jobWithId)
                const notionResult = await addJobToNotion(jobWithId)
                console.log('📋 Notion result:', notionResult)
                if (notionResult.success) {
                  console.log('✅ Job synced to Notion')
                } else {
                  console.log('⚠️ Notion sync failed:', notionResult.message)
                }
              } catch (notionError) {
                console.error('❌ Notion sync failed:', notionError.message)
                console.error('❌ Notion error details:', notionError)
              }
              
              // Clear the newJob localStorage
              localStorage.removeItem('newJob')
              localStorage.removeItem('newJobTimestamp')
              console.log('🧹 Cleared newJob localStorage')
            } catch (error) {
              console.error('❌ Error adding job to localStorage:', error)
            }
          }
          
          addJobToStorage()
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

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e) => {
      console.log('🔄 Storage event detected:', e.key, e.newValue)
      if (e.key === 'newJob' && e.newValue) {
        console.log('🔄 Storage event detected - new job from another tab')
        checkForNewJobs()
      }
    }
    
    // Listen for custom events from browser extension
    const handleCustomEvent = (e) => {
      console.log('🔄 Custom event detected - new job from browser extension', e.detail)
      checkForNewJobs()
    }
    
    // Listen for BroadcastChannel messages from other tabs
    const handleBroadcastMessage = (e) => {
      console.log('🔄 BroadcastChannel message received:', e.data)
      if (e.data.type === 'new-job') {
        console.log('🔄 New job from BroadcastChannel:', e.data.job)
        checkForNewJobs()
      }
    }
    
    const broadcastChannel = new BroadcastChannel('job-tracker')
    broadcastChannel.addEventListener('message', handleBroadcastMessage)
    console.log('🔊 BroadcastChannel created and listening for messages')
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('job-tracker-new-job', handleCustomEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('job-tracker-new-job', handleCustomEvent)
      broadcastChannel.removeEventListener('message', handleBroadcastMessage)
      broadcastChannel.close()
    }
  }, [])

  // Manual refresh function
  const refreshJobs = () => {
    setLoading(true)
    try {
      const storedJobs = localStorage.getItem('jobTrackerJobs')
      if (storedJobs) {
        const jobs = JSON.parse(storedJobs)
        setJobs(jobs)
        console.log('🔄 Refreshed jobs from localStorage:', jobs.length)
      } else {
        setJobs([])
        console.log('🔄 No jobs found in localStorage')
      }
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
                onClick={() => {
                  console.log('🔍 Manual localStorage check')
                  const newJob = localStorage.getItem('newJob')
                  const newJobTimestamp = localStorage.getItem('newJobTimestamp')
                  console.log('Current localStorage:', { newJob, newJobTimestamp })
                  if (newJob) {
                    console.log('Found job in localStorage:', JSON.parse(newJob))
                  }
                  
                  // Also check all localStorage keys
                  console.log('All localStorage keys:', Object.keys(localStorage))
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    console.log(`localStorage[${key}]:`, localStorage.getItem(key))
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Check localStorage
              </button>
              <button
                onClick={() => {
                  console.log('🧪 Testing job processing manually')
                  // Manually set a test job in localStorage
                  const testJob = {
                    title: 'Test Job',
                    company: 'Test Company',
                    url: 'https://example.com',
                    applied: new Date().toISOString()
                  }
                  localStorage.setItem('newJob', JSON.stringify(testJob))
                  localStorage.setItem('newJobTimestamp', Date.now().toString())
                  console.log('🧪 Test job set in localStorage')
                  
                  // Also test BroadcastChannel
                  const channel = new BroadcastChannel('job-tracker')
                  channel.postMessage({
                    type: 'new-job',
                    job: testJob
                  })
                  console.log('🧪 BroadcastChannel message sent')
                  channel.close()
                  
                  // Trigger the check
                  setTimeout(() => {
                    console.log('🧪 Triggering manual check...')
                    const newJob = localStorage.getItem('newJob')
                    const newJobTimestamp = localStorage.getItem('newJobTimestamp')
                    console.log('🧪 Manual check - newJob:', newJob)
                    console.log('🧪 Manual check - newJobTimestamp:', newJobTimestamp)
                  }, 100)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Test Job
              </button>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 01-2-2V6" />
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