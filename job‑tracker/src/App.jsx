import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { getCongratsMessage } from './lib/groq'
import { addJobToNotion } from './lib/notion'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [message, setMessage] = useState('')

  // Load realtime updates from Supabase
  useEffect(() => {
    const subscription = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    // fetch initial list
    const fetch = async () => {
      const { data } = await supabase.from('jobs').select()
      setJobs(data ?? [])
    }
    fetch()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Simulate clicking an "Apply" button on a job site
  const handleApply = async () => {
    // In real usage, you’ll grab these from the page DOM or a browser extension
    const job = {
      title: 'Frontend Engineer',
      company: 'TechCo',
      url: 'https://jobs.techco.com/123',
      applied: new Date().toISOString()
    }

    // 1️⃣ Insert into Supabase
    const { data: inserted, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return alert(error.message)
    }

    console.log('Supabase inserted data:', inserted)

    // 2️⃣ Push to Notion
    try {
      if (inserted) {
        await addJobToNotion(inserted)
        console.log('Job synced to Notion successfully!')
      } else {
        console.warn('No data returned from Supabase')
      }
    } catch (e) {
      console.error('Notion sync failed', e)
      // Continue execution even if Notion fails
    }

    // 3️⃣ Generate a fun message
    const msg = await getCongratsMessage(job.title)
    setMessage(msg)

    // 4️⃣ Reset after 5 sec
    setTimeout(() => setMessage(''), 5000)
  }

  const [count, setCount] = useState(0)
  const [level, setLevel] = useState(1)

  // Update level when job count crosses thresholds
  useEffect(() => {
    setCount(jobs.length)
    setLevel(Math.floor(jobs.length / 10) + 1) // e.g. level 1 = 0-9, level 2 = 10-19
  }, [jobs])

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Job Tracker Dashboard</h1>
      
      <div className="mb-6 p-4 bg-indigo-50 rounded">
        <p>
          <strong>You're at level {level}</strong> – {count} applications so far! 🎉
        </p>
      </div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        onClick={handleApply}
      >
        Simulate “Apply” click
      </button>

      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((j, idx) => (
          <div key={idx} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">{j.title}</h3>
            <p>{j.company}</p>
            <a href={j.url} target="_blank" className="text-blue-500 underline">
              View posting
            </a>
            <p className="text-sm text-gray-500">
              Applied on: {new Date(j.applied).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  
  
  )


}