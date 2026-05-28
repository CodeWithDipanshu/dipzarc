'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import type { Profile } from '@/types'

export function useProfile() {
  const { profile, setProfile } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    if (profile) return   // already loaded

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as Profile)
    }
    load()
  }, [])

  return profile
}
