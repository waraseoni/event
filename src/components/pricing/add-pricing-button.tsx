'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AddPricingButton() {
  return (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      नया मूल्य
    </Button>
  )
}
