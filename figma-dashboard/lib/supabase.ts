import { createClient } from '@supabase/supabase-js'

// Supabase client for client-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (based on aegis_schema_v8.sql)
export interface InventoryVehicle {
  vin: string
  dealer: string
  make?: string
  model?: string
  year?: number
  trim?: string
  msrp?: number
  price?: number
  stock_number?: string
  _ingested_at?: string
}

export interface MarketInsights {
  date: string
  dealership_name: string
  oem: string
  units_sold: number
  market_share?: number
  region?: string
}

export interface GoogleTrendsTimeSeries {
  date: string
  brand_name: string
  popularity_score: number
  region: string
  date_pulled?: string
}

export interface GoogleTrendsRisingQueries {
  query: string
  search_interest: number
  increase_percent?: string
  region: string
  date_pulled: string
}

export interface GoogleTrendsTopQueries {
  query: string
  search_interest: number
  increase_percent?: string
  region: string
  date_pulled: string
}

// API helpers
export const fetchInventory = async (dealer?: string) => {
  let query = supabase.from('inventory_vehicle').select('*')

  if (dealer) {
    query = query.eq('dealer', dealer)
  }

  const { data, error } = await query.order('_ingested_at', { ascending: false }).limit(100)

  if (error) throw error
  return data as InventoryVehicle[]
}

export const fetchMarketInsights = async () => {
  const { data, error } = await supabase
    .from('market_insights')
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

  if (error) throw error
  return data as MarketInsights[]
}

export const fetchGoogleTrendsTimeSeries = async (region?: string) => {
  let query = supabase.from('google_trends_time_series').select('*')

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query.order('date', { ascending: false }).limit(500)

  if (error) throw error
  return data as GoogleTrendsTimeSeries[]
}

export const fetchGoogleTrendsRisingQueries = async (region?: string) => {
  let query = supabase.from('google_trends_rising_queries').select('*')

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query
    .order('search_interest', { ascending: false })
    .limit(20)

  if (error) throw error
  return data as GoogleTrendsRisingQueries[]
}

export const fetchGoogleTrendsTopQueries = async (region?: string) => {
  let query = supabase.from('google_trends_top_queries').select('*')

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query
    .order('search_interest', { ascending: false })
    .limit(20)

  if (error) throw error
  return data as GoogleTrendsTopQueries[]
}
