'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Contact } from '@/types'
import { useLanguage } from '@/contexts/language-context'

interface EditContactButtonProps {
  contact: Contact
  onContactUpdated: () => void
}

export function EditContactButton({ contact, onContactUpdated }: EditContactButtonProps) {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Contact>({
    ...contact,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase
        .from('contacts')
        .update as any)({
          name: formData.name,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          company_name: formData.company_name,
          gst_number: formData.gst_number,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id)

      if (error) throw error

      setIsOpen(false)
      onContactUpdated()
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-muted rounded"
      >
        <Edit className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Contact' : 'संपर्क संपादित करें'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  {language === 'en' ? 'Name' : 'नाम'} *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">
                  {language === 'en' ? 'Type' : 'प्रकार'} *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, type: value as Contact['type'] })
                  }
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">
                      {language === 'en' ? 'Customer' : 'ग्राहक'}
                    </SelectItem>
                    <SelectItem value="vendor">
                      {language === 'en' ? 'Vendor' : 'विक्रेता'}
                    </SelectItem>
                    <SelectItem value="renter">
                      {language === 'en' ? 'Renter' : 'किरायेदार'}
                    </SelectItem>
                    <SelectItem value="worker">
                      {language === 'en' ? 'Worker' : 'कर्मचारी'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">
                  {language === 'en' ? 'Phone' : 'फोन'} *
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  {language === 'en' ? 'Email' : 'ईमेल'}
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">
                {language === 'en' ? 'Address' : 'पता'}
              </Label>
              <Textarea
                id="edit-address"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-company">
                  {language === 'en' ? 'Company Name' : 'कंपनी का नाम'}
                </Label>
                <Input
                  id="edit-company"
                  value={formData.company_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gst">
                  {language === 'en' ? 'GST Number' : 'जीएसटी नंबर'}
                </Label>
                <Input
                  id="edit-gst"
                  value={formData.gst_number || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, gst_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">
                {language === 'en' ? 'Notes' : 'नोट्स'}
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {language === 'en' ? 'Save Changes' : 'बदलाव सहेजें'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
