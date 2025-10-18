import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function cleanupDatabase() {
  try {
    console.log('🧹 Cleaning up database...')
    
    // Delete all existing jobs
    const { error } = await supabase
      .from('jobs')
      .delete()
      .neq('id', 0) // Delete all rows
    
    if (error) {
      console.error('Error cleaning database:', error)
    } else {
      console.log('✅ Database cleaned successfully!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

cleanupDatabase()
