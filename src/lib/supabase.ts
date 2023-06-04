import { Request, Response, NextFunction } from 'express'
import { SupabaseClient, createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
	throw new Error(
		'Missing SUPABASE_URL or SUPABASE_KEY. Cannot start application.'
	)
}

export default createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
