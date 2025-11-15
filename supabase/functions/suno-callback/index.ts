// Supabase Edge Function to receive Suno API callbacks
// This function needs to be PUBLIC (no auth) to receive callbacks from Suno

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SunoCallbackPayload {
  code: number
  msg: string
  data: {
    callbackType: 'text' | 'first' | 'complete' | 'error'
    task_id: string
    data: Array<{
      id: string
      audio_url: string
      source_audio_url: string
      stream_audio_url: string
      source_stream_audio_url: string
      image_url: string
      source_image_url: string
      prompt: string
      model_name: string
      title: string
      tags: string
      createTime: string
      duration: number
    }> | null
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      throw new Error('Server configuration error')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse callback payload
    const payload: SunoCallbackPayload = await req.json()
    
    console.log('✅ Received Suno callback:', JSON.stringify(payload, null, 2))

    const { code, msg, data } = payload
    const { callbackType, task_id, data: tracks } = data

    console.log(`📝 Processing callback for task ${task_id}, type: ${callbackType}, code: ${code}`)

    // Update generation status based on callback type
    // Accept tracks from 'text', 'first', or 'complete' callbacks
    if (code === 200 && (callbackType === 'complete' || callbackType === 'first' || callbackType === 'text') && tracks && tracks.length > 0) {
      console.log(`🎵 Received ${tracks.length} tracks for task ${task_id} (callback: ${callbackType})`)

      // Try to get generation ID
      const { data: generation, error: genError } = await supabaseClient
        .from('generations')
        .select('id')
        .eq('task_id', task_id)
        .single()

      if (genError || !generation) {
        console.log(`⚠️  No authenticated generation found for task ${task_id}`)
        console.log('Checking anonymous_generations table...')
        
        // Try anonymous generations table
        const { data: anonGen, error: anonError } = await supabaseClient
          .from('anonymous_generations')
          .select('task_id')
          .eq('task_id', task_id)
          .single()

        if (anonError || !anonGen) {
          console.log('❌ Not found in anonymous_generations either - ignoring callback')
          return new Response(
            JSON.stringify({ 
              status: 'ignored', 
              task_id,
              note: 'Task not found in database'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        console.log('✅ Found in anonymous_generations - saving anonymous tracks')

        // Update status: 'processing' for text/first callbacks (stream_audio_url available), 'completed' for complete callback
        const newStatus = callbackType === 'complete' ? 'completed' : 'processing'
        await supabaseClient
          .from('anonymous_generations')
          .update({ status: newStatus })
          .eq('task_id', task_id)

        // Upsert anonymous tracks (insert or update if exists)
        // Note: duration might be null in early callbacks (text/first), default to 0
        const anonTrackUpserts = tracks.map((track) => ({
          task_id: task_id,
          suno_id: track.id,
          title: track.title,
          tags: track.tags,
          prompt: track.prompt,
          model_name: track.model_name,
          audio_url: track.audio_url || '',
          source_audio_url: track.source_audio_url || '',
          stream_audio_url: track.stream_audio_url || '',
          image_url: track.image_url || '',
          duration: track.duration || 0,
        }))

        const { error: anonTracksError } = await supabaseClient
          .from('anonymous_tracks')
          .upsert(anonTrackUpserts, { 
            onConflict: 'task_id,suno_id',
            ignoreDuplicates: false 
          })

        if (anonTracksError) {
          console.error('❌ Error upserting anonymous tracks:', anonTracksError)
          throw anonTracksError
        }

        console.log(`✅ Successfully saved ${tracks.length} anonymous tracks for task ${task_id} (callback: ${callbackType})`)
        
        return new Response(
          JSON.stringify({ status: 'received', task_id, type: 'anonymous' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      console.log(`📦 Generation ID: ${generation.id}`)

      // Update status: 'processing' for text/first callbacks (stream_audio_url available), 'completed' for complete callback
      const newStatus = callbackType === 'complete' ? 'completed' : 'processing'
      const { error: updateError } = await supabaseClient
        .from('generations')
        .update({ status: newStatus })
        .eq('task_id', task_id)

      if (updateError) {
        console.error('❌ Error updating generation:', updateError)
        throw updateError
      }

      // Upsert tracks (insert or update if exists)
      // Note: duration might be null in early callbacks (text/first), default to 0
      const trackUpserts = tracks.map((track) => ({
        generation_id: generation.id,
        suno_id: track.id,
        title: track.title,
        tags: track.tags,
        prompt: track.prompt,
        model_name: track.model_name,
        audio_url: track.audio_url || '',
        source_audio_url: track.source_audio_url || '',
        stream_audio_url: track.stream_audio_url || '',
        image_url: track.image_url || '',
        duration: track.duration || 0,
      }))

      const { error: tracksError } = await supabaseClient
        .from('tracks')
        .upsert(trackUpserts, { 
          onConflict: 'generation_id,suno_id',
          ignoreDuplicates: false 
        })

      if (tracksError) {
        console.error('❌ Error upserting tracks:', tracksError)
        throw tracksError
      }

      console.log(`✅ Successfully saved ${tracks.length} tracks for task ${task_id} (callback: ${callbackType})`)
    } else if (code !== 200 || callbackType === 'error') {
      console.log(`❌ Task ${task_id} failed: ${msg}`)

      // Try to update generation to failed (ignore if not found - anonymous user)
      const { error: updateError } = await supabaseClient
        .from('generations')
        .update({ 
          status: 'failed',
          error_message: msg 
        })
        .eq('task_id', task_id)

      if (updateError && updateError.code !== 'PGRST116') {
        console.error('❌ Error updating generation to failed:', updateError)
      }
    } else if (callbackType === 'processing') {
      // Note: 'first' and 'text' are now handled in the main if block above
      console.log(`⏳ Task ${task_id} still processing (${callbackType})`)

      // Try to update to processing status (ignore if not found - anonymous user)
      const { error: updateError } = await supabaseClient
        .from('generations')
        .update({ status: 'processing' })
        .eq('task_id', task_id)

      if (updateError && updateError.code !== 'PGRST116') {
        console.error('❌ Error updating generation to processing:', updateError)
      }
    } else if (callbackType === 'first' || callbackType === 'text') {
      // If 'first' or 'text' callback arrives without tracks data, log it
      console.log(`⚠️ Received '${callbackType}' callback for task ${task_id} but no tracks data yet`)
    }

    return new Response(
      JSON.stringify({ status: 'received', task_id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error processing callback:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
