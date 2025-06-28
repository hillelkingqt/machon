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

    const { action, userId, sessionId, preferences } = await req.json()

    let result = {}

    switch (action) {
      case 'get_personalized_content':
        result = await getPersonalizedContent(supabaseClient, userId, sessionId)
        break
      case 'update_preferences':
        result = await updateUserPreferences(supabaseClient, userId, preferences)
        break
      case 'get_recommendations':
        result = await getRecommendations(supabaseClient, userId, sessionId)
        break
      case 'track_interaction':
        result = await trackInteraction(supabaseClient, userId, sessionId, req.body)
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

async function getPersonalizedContent(supabaseClient: any, userId: string, sessionId: string) {
  // Get user's interaction history
  const { data: interactions } = await supabaseClient
    .from('ai_context_log')
    .select('*')
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .order('created_at', { ascending: false })
    .limit(100)

  // Analyze user behavior patterns
  const behaviorAnalysis = analyzeUserBehavior(interactions || [])
  
  // Get articles and courses
  const { data: articles } = await supabaseClient
    .from('articles')
    .select('*')
    .limit(20)

  const { data: courses } = await supabaseClient
    .from('courses')
    .select('*')
    .limit(10)

  // Generate personalized recommendations
  const personalizedContent = {
    recommendedArticles: filterAndRankContent(articles || [], behaviorAnalysis, 'article'),
    recommendedCourses: filterAndRankContent(courses || [], behaviorAnalysis, 'course'),
    personalizedGreeting: generatePersonalizedGreeting(behaviorAnalysis),
    suggestedActions: generateSuggestedActions(behaviorAnalysis),
    learningPath: generateLearningPath(behaviorAnalysis, courses || [])
  }

  return personalizedContent
}

async function updateUserPreferences(supabaseClient: any, userId: string, preferences: any) {
  const { error } = await supabaseClient
    .from('user_preferences')
    .upsert([
      {
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString()
      }
    ])

  if (error) {
    throw error
  }

  return { success: true, message: 'Preferences updated successfully' }
}

async function getRecommendations(supabaseClient: any, userId: string, sessionId: string) {
  // Get user's recent activity
  const { data: recentActivity } = await supabaseClient
    .from('ai_context_log')
    .select('*')
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false })

  const recommendations = generateRecommendations(recentActivity || [])

  return {
    recommendations,
    confidence: calculateRecommendationConfidence(recentActivity || []),
    reasoning: generateRecommendationReasoning(recentActivity || [])
  }
}

async function trackInteraction(supabaseClient: any, userId: string, sessionId: string, interactionData: any) {
  const { error } = await supabaseClient
    .from('ai_context_log')
    .insert([
      {
        event: 'PERSONALIZATION_INTERACTION',
        data: interactionData,
        user_id: userId,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    ])

  if (error) {
    throw error
  }

  return { success: true }
}

function analyzeUserBehavior(interactions: any[]) {
  const analysis = {
    interests: new Map(),
    preferredContentTypes: new Map(),
    engagementPatterns: {
      timeOfDay: new Map(),
      sessionDuration: 0,
      interactionFrequency: 0
    },
    learningStyle: 'unknown',
    skillLevel: 'beginner',
    goals: []
  }

  interactions.forEach(interaction => {
    // Analyze page visits to determine interests
    if (interaction.current_page) {
      const page = interaction.current_page
      if (page.includes('courses')) {
        analysis.interests.set('courses', (analysis.interests.get('courses') || 0) + 1)
      }
      if (page.includes('articles')) {
        analysis.interests.set('articles', (analysis.interests.get('articles') || 0) + 1)
      }
      if (page.includes('gifted')) {
        analysis.interests.set('gifted_programs', (analysis.interests.get('gifted_programs') || 0) + 1)
      }
    }

    // Analyze interaction types
    if (interaction.event === 'USER_INTERACTION') {
      const type = interaction.data?.type
      if (type) {
        analysis.preferredContentTypes.set(type, (analysis.preferredContentTypes.get(type) || 0) + 1)
      }
    }

    // Analyze time patterns
    const hour = new Date(interaction.created_at).getHours()
    analysis.engagementPatterns.timeOfDay.set(hour, (analysis.engagementPatterns.timeOfDay.get(hour) || 0) + 1)
  })

  // Determine learning style based on behavior
  const videoInteractions = analysis.preferredContentTypes.get('video') || 0
  const textInteractions = analysis.preferredContentTypes.get('text') || 0
  const interactiveInteractions = analysis.preferredContentTypes.get('interactive') || 0

  if (videoInteractions > textInteractions && videoInteractions > interactiveInteractions) {
    analysis.learningStyle = 'visual'
  } else if (interactiveInteractions > textInteractions) {
    analysis.learningStyle = 'kinesthetic'
  } else {
    analysis.learningStyle = 'reading'
  }

  // Determine skill level based on content engagement
  const advancedContent = interactions.filter(i => 
    i.current_page?.includes('advanced') || 
    i.data?.difficulty === 'advanced'
  ).length

  if (advancedContent > interactions.length * 0.3) {
    analysis.skillLevel = 'advanced'
  } else if (advancedContent > interactions.length * 0.1) {
    analysis.skillLevel = 'intermediate'
  }

  return analysis
}

function filterAndRankContent(content: any[], behaviorAnalysis: any, contentType: string) {
  return content
    .map(item => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, behaviorAnalysis, contentType)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5) // Top 5 recommendations
}

function calculateRelevanceScore(item: any, behaviorAnalysis: any, contentType: string) {
  let score = 0

  // Base score
  score += 1

  // Interest matching
  if (contentType === 'course' && behaviorAnalysis.interests.has('courses')) {
    score += behaviorAnalysis.interests.get('courses') * 0.1
  }
  if (contentType === 'article' && behaviorAnalysis.interests.has('articles')) {
    score += behaviorAnalysis.interests.get('articles') * 0.1
  }

  // Skill level matching
  if (item.difficulty) {
    if (item.difficulty === behaviorAnalysis.skillLevel) {
      score += 2
    } else if (
      (behaviorAnalysis.skillLevel === 'beginner' && item.difficulty === 'intermediate') ||
      (behaviorAnalysis.skillLevel === 'intermediate' && item.difficulty === 'advanced')
    ) {
      score += 1 // Slightly challenging content
    }
  }

  // Learning style matching
  if (item.format) {
    if (
      (behaviorAnalysis.learningStyle === 'visual' && item.format.includes('video')) ||
      (behaviorAnalysis.learningStyle === 'reading' && item.format.includes('text')) ||
      (behaviorAnalysis.learningStyle === 'kinesthetic' && item.format.includes('interactive'))
    ) {
      score += 1.5
    }
  }

  // Recency boost for newer content
  if (item.created_at) {
    const daysSinceCreation = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation < 30) {
      score += 0.5
    }
  }

  return score
}

function generatePersonalizedGreeting(behaviorAnalysis: any) {
  const topInterest = Array.from(behaviorAnalysis.interests.entries())
    .sort((a, b) => b[1] - a[1])[0]

  if (!topInterest) {
    return "שלום! אני כאן לעזור לך עם כל מה שקשור למכון אביב."
  }

  const greetings = {
    courses: "שלום! אני רואה שאתה מעוניין בקורסים שלנו. איך אני יכול לעזור לך למצוא את הקורס המושלם?",
    articles: "שלום! נראה שאתה אוהב לקרוא את המאמרים שלנו. יש לי כמה המלצות מעולות בשבילך!",
    gifted_programs: "שלום! אני רואה שאתה מתעניין בתוכניות למחוננים. אני כאן לעזור לך עם כל השאלות!"
  }

  return greetings[topInterest[0] as keyof typeof greetings] || greetings.courses
}

function generateSuggestedActions(behaviorAnalysis: any) {
  const actions = []

  if (behaviorAnalysis.interests.has('courses') && !behaviorAnalysis.interests.has('purchase')) {
    actions.push({
      type: 'course_recommendation',
      text: 'צפה בקורסים המומלצים בשבילך',
      action: 'show_recommended_courses'
    })
  }

  if (behaviorAnalysis.skillLevel === 'beginner') {
    actions.push({
      type: 'learning_path',
      text: 'התחל במסלול למידה מותאם למתחילים',
      action: 'start_beginner_path'
    })
  }

  if (behaviorAnalysis.engagementPatterns.interactionFrequency < 3) {
    actions.push({
      type: 'engagement',
      text: 'קבל סיור מודרך באתר',
      action: 'start_guided_tour'
    })
  }

  return actions
}

function generateLearningPath(behaviorAnalysis: any, courses: any[]) {
  const path = []

  // Sort courses by difficulty and relevance
  const sortedCourses = courses
    .filter(course => course.difficulty)
    .sort((a, b) => {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
      return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
             difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
    })

  // Create learning path based on user's skill level
  const userLevel = behaviorAnalysis.skillLevel
  const startIndex = userLevel === 'beginner' ? 0 : userLevel === 'intermediate' ? 1 : 2

  for (let i = startIndex; i < Math.min(startIndex + 3, sortedCourses.length); i++) {
    if (sortedCourses[i]) {
      path.push({
        course: sortedCourses[i],
        estimatedDuration: calculateEstimatedDuration(sortedCourses[i]),
        prerequisites: getPrerequisites(sortedCourses[i], sortedCourses.slice(0, i))
      })
    }
  }

  return path
}

function generateRecommendations(recentActivity: any[]) {
  const recommendations = []

  // Analyze recent activity patterns
  const pageVisits = new Map()
  const interactions = new Map()

  recentActivity.forEach(activity => {
    if (activity.current_page) {
      pageVisits.set(activity.current_page, (pageVisits.get(activity.current_page) || 0) + 1)
    }
    if (activity.event === 'USER_INTERACTION') {
      interactions.set(activity.data?.type, (interactions.get(activity.data?.type) || 0) + 1)
    }
  })

  // Generate recommendations based on patterns
  if (pageVisits.has('/courses') && !interactions.has('purchase')) {
    recommendations.push({
      type: 'course_purchase',
      title: 'השלם את הרכישה',
      description: 'נראה שאתה מעוניין בקורס. האם תרצה עזרה בבחירה או ברכישה?',
      priority: 'high',
      action: 'assist_with_purchase'
    })
  }

  if (pageVisits.has('/articles') && pageVisits.get('/articles') > 3) {
    recommendations.push({
      type: 'newsletter_signup',
      title: 'הירשם לניוזלטר',
      description: 'אני רואה שאתה אוהב את המאמרים שלנו. הירשם לניוזלטר לקבלת עדכונים!',
      priority: 'medium',
      action: 'signup_newsletter'
    })
  }

  return recommendations
}

function calculateRecommendationConfidence(recentActivity: any[]) {
  if (recentActivity.length < 5) return 'low'
  if (recentActivity.length < 15) return 'medium'
  return 'high'
}

function generateRecommendationReasoning(recentActivity: any[]) {
  const reasons = []

  const uniquePages = new Set(recentActivity.map(a => a.current_page).filter(Boolean))
  if (uniquePages.size > 3) {
    reasons.push('המשתמש צפה במספר עמודים שונים')
  }

  const interactions = recentActivity.filter(a => a.event === 'USER_INTERACTION')
  if (interactions.length > 5) {
    reasons.push('המשתמש מקיים אינטראקציות פעילות')
  }

  const timeSpent = recentActivity.length > 0 ? 
    (new Date(recentActivity[0].created_at).getTime() - 
     new Date(recentActivity[recentActivity.length - 1].created_at).getTime()) / 1000 / 60 : 0

  if (timeSpent > 10) {
    reasons.push('המשתמש מבלה זמן רב באתר')
  }

  return reasons.join(', ') || 'ניתוח התנהגות בסיסי'
}

function calculateEstimatedDuration(course: any) {
  // Mock calculation - in real implementation, this would be based on course content
  const baseDuration = course.lessons ? course.lessons * 30 : 120 // 30 minutes per lesson
  return `${Math.ceil(baseDuration / 60)} שעות`
}

function getPrerequisites(course: any, previousCourses: any[]) {
  // Mock prerequisites - in real implementation, this would be based on course metadata
  if (course.difficulty === 'intermediate' && previousCourses.length > 0) {
    return [previousCourses[0].title]
  }
  if (course.difficulty === 'advanced' && previousCourses.length > 1) {
    return previousCourses.slice(0, 2).map(c => c.title)
  }
  return []
}