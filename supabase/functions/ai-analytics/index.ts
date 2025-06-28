import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { action, timeframe = '24h' } = await req.json()

    let query = supabaseClient
      .from('ai_context_log')
      .select('*')

    // Add time filter
    const now = new Date()
    let startTime = new Date()
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '24h':
        startTime.setDate(now.getDate() - 1)
        break
      case '7d':
        startTime.setDate(now.getDate() - 7)
        break
      case '30d':
        startTime.setDate(now.getDate() - 30)
        break
    }

    query = query.gte('created_at', startTime.toISOString())

    const { data, error } = await query

    if (error) {
      throw error
    }

    let result = {}

    switch (action) {
      case 'user_behavior_analysis':
        result = analyzeUserBehavior(data)
        break
      case 'performance_metrics':
        result = analyzePerformanceMetrics(data)
        break
      case 'engagement_patterns':
        result = analyzeEngagementPatterns(data)
        break
      case 'predictive_insights':
        result = generatePredictiveInsights(data)
        break
      case 'system_health':
        result = analyzeSystemHealth(data)
        break
      default:
        result = { error: 'Unknown action' }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function analyzeUserBehavior(data: any[]) {
  const userSessions = new Map()
  const pageViews = new Map()
  const interactions = new Map()

  data.forEach(entry => {
    if (entry.session_id) {
      if (!userSessions.has(entry.session_id)) {
        userSessions.set(entry.session_id, {
          startTime: entry.created_at,
          events: [],
          pages: new Set(),
          interactions: 0
        })
      }
      
      const session = userSessions.get(entry.session_id)
      session.events.push(entry)
      
      if (entry.current_page) {
        session.pages.add(entry.current_page)
        pageViews.set(entry.current_page, (pageViews.get(entry.current_page) || 0) + 1)
      }
      
      if (entry.event === 'USER_INTERACTION') {
        session.interactions++
        interactions.set(entry.data?.type || 'unknown', (interactions.get(entry.data?.type || 'unknown') || 0) + 1)
      }
    }
  })

  return {
    totalSessions: userSessions.size,
    averageSessionDuration: calculateAverageSessionDuration(userSessions),
    mostVisitedPages: Array.from(pageViews.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
    topInteractions: Array.from(interactions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
    userJourneyPatterns: analyzeUserJourneys(userSessions)
  }
}

function analyzePerformanceMetrics(data: any[]) {
  const performanceData = data.filter(entry => entry.event === 'PERFORMANCE_METRIC')
  
  if (performanceData.length === 0) {
    return { message: 'No performance data available' }
  }

  const metrics = {
    averageLoadTime: 0,
    slowestPages: [],
    resourceUsage: {},
    networkLatency: []
  }

  performanceData.forEach(entry => {
    if (entry.data?.duration) {
      metrics.averageLoadTime += entry.data.duration
    }
    
    if (entry.system_metrics) {
      const sm = entry.system_metrics
      if (sm.networkLatency) {
        metrics.networkLatency.push(sm.networkLatency)
      }
    }
  })

  metrics.averageLoadTime = metrics.averageLoadTime / performanceData.length

  return metrics
}

function analyzeEngagementPatterns(data: any[]) {
  const hourlyEngagement = new Array(24).fill(0)
  const dailyEngagement = new Array(7).fill(0)
  const engagementByPage = new Map()

  data.forEach(entry => {
    const date = new Date(entry.created_at)
    const hour = date.getHours()
    const day = date.getDay()
    
    hourlyEngagement[hour]++
    dailyEngagement[day]++
    
    if (entry.current_page) {
      engagementByPage.set(entry.current_page, (engagementByPage.get(entry.current_page) || 0) + 1)
    }
  })

  return {
    peakHours: hourlyEngagement.map((count, hour) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    peakDays: dailyEngagement.map((count, day) => ({ day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day], count })).sort((a, b) => b.count - a.count),
    mostEngagingPages: Array.from(engagementByPage.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }
}

function generatePredictiveInsights(data: any[]) {
  const userPatterns = new Map()
  const conversionFunnels = new Map()
  
  data.forEach(entry => {
    if (entry.user_id) {
      if (!userPatterns.has(entry.user_id)) {
        userPatterns.set(entry.user_id, {
          pages: [],
          actions: [],
          timeSpent: 0,
          lastSeen: entry.created_at
        })
      }
      
      const pattern = userPatterns.get(entry.user_id)
      if (entry.current_page) {
        pattern.pages.push(entry.current_page)
      }
      if (entry.event === 'USER_INTERACTION') {
        pattern.actions.push(entry.data?.type)
      }
    }
  })

  const predictions = []
  
  userPatterns.forEach((pattern, userId) => {
    // Predict likely next actions
    if (pattern.pages.includes('/courses') && !pattern.actions.includes('purchase')) {
      predictions.push({
        userId,
        prediction: 'likely_to_purchase_course',
        confidence: 0.7,
        reasoning: 'User visited courses page but hasn\'t purchased'
      })
    }
    
    if (pattern.pages.length > 5 && pattern.actions.length < 2) {
      predictions.push({
        userId,
        prediction: 'needs_assistance',
        confidence: 0.8,
        reasoning: 'High page views but low interaction rate'
      })
    }
  })

  return {
    userPredictions: predictions,
    trendAnalysis: analyzeTrends(data),
    recommendations: generateRecommendations(userPatterns)
  }
}

function analyzeSystemHealth(data: any[]) {
  const systemMetrics = data.filter(entry => entry.system_metrics).map(entry => entry.system_metrics)
  
  if (systemMetrics.length === 0) {
    return { message: 'No system metrics available' }
  }

  const health = {
    averageMemoryUsage: 0,
    averageCpuUsage: 0,
    networkIssues: 0,
    batteryLevels: [],
    connectionTypes: new Map()
  }

  systemMetrics.forEach(metrics => {
    if (metrics.memoryUsage) {
      health.averageMemoryUsage += typeof metrics.memoryUsage === 'object' ? 
        (metrics.memoryUsage.used / metrics.memoryUsage.total) * 100 : 
        metrics.memoryUsage
    }
    
    if (metrics.cpuUsage) {
      health.averageCpuUsage += metrics.cpuUsage
    }
    
    if (metrics.networkLatency > 1000) {
      health.networkIssues++
    }
    
    if (metrics.batteryLevel) {
      health.batteryLevels.push(metrics.batteryLevel)
    }
    
    if (metrics.connectionType) {
      health.connectionTypes.set(metrics.connectionType, (health.connectionTypes.get(metrics.connectionType) || 0) + 1)
    }
  })

  health.averageMemoryUsage = health.averageMemoryUsage / systemMetrics.length
  health.averageCpuUsage = health.averageCpuUsage / systemMetrics.length

  return {
    ...health,
    healthScore: calculateHealthScore(health),
    alerts: generateHealthAlerts(health)
  }
}

function calculateAverageSessionDuration(userSessions: Map<string, any>) {
  let totalDuration = 0
  let validSessions = 0

  userSessions.forEach(session => {
    if (session.events.length > 1) {
      const start = new Date(session.events[0].created_at)
      const end = new Date(session.events[session.events.length - 1].created_at)
      totalDuration += (end.getTime() - start.getTime()) / 1000 / 60 // minutes
      validSessions++
    }
  })

  return validSessions > 0 ? totalDuration / validSessions : 0
}

function analyzeUserJourneys(userSessions: Map<string, any>) {
  const journeys = new Map()

  userSessions.forEach(session => {
    const pages = Array.from(session.pages)
    const journey = pages.join(' -> ')
    journeys.set(journey, (journeys.get(journey) || 0) + 1)
  })

  return Array.from(journeys.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
}

function analyzeTrends(data: any[]) {
  // Simple trend analysis - could be much more sophisticated
  const daily = new Map()
  
  data.forEach(entry => {
    const date = new Date(entry.created_at).toDateString()
    daily.set(date, (daily.get(date) || 0) + 1)
  })

  const sortedDays = Array.from(daily.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
  
  return {
    dailyActivity: sortedDays,
    trend: sortedDays.length > 1 ? 
      (sortedDays[sortedDays.length - 1][1] > sortedDays[0][1] ? 'increasing' : 'decreasing') : 
      'stable'
  }
}

function generateRecommendations(userPatterns: Map<string, any>) {
  const recommendations = []

  userPatterns.forEach((pattern, userId) => {
    if (pattern.pages.includes('/articles') && pattern.pages.includes('/courses')) {
      recommendations.push({
        userId,
        type: 'cross_sell',
        message: 'User interested in both content and courses - recommend premium package'
      })
    }
    
    if (pattern.timeSpent > 300 && pattern.actions.length === 0) {
      recommendations.push({
        userId,
        type: 'engagement',
        message: 'User spending time but not engaging - offer help or guided tour'
      })
    }
  })

  return recommendations
}

function calculateHealthScore(health: any) {
  let score = 100
  
  if (health.averageMemoryUsage > 80) score -= 20
  if (health.averageCpuUsage > 80) score -= 20
  if (health.networkIssues > 10) score -= 30
  
  return Math.max(0, score)
}

function generateHealthAlerts(health: any) {
  const alerts = []
  
  if (health.averageMemoryUsage > 90) {
    alerts.push({ type: 'critical', message: 'High memory usage detected' })
  }
  
  if (health.networkIssues > 20) {
    alerts.push({ type: 'warning', message: 'Multiple network issues detected' })
  }
  
  return alerts
}