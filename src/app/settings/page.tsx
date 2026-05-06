'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Image as ImageIcon,
  Save,
  Upload,
  Globe,
  Link as LinkIcon,
  Currency,
  Settings,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { useSystemSettings, formatCurrency, getFullAddress } from '@/contexts/system-settings-context'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

// Simple Label and Input components since they might not exist
function FormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium text-slate-700", className)}>{children}</label>
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
        "transition-all duration-200",
        props.className
      )}
    />
  )
}

function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
        "transition-all duration-200 resize-none",
        props.className
      )}
    />
  )
}

export default function SettingsPage() {
  const { settings, loading, updateSettings, uploadLogo, uploadBanner } = useSystemSettings()
  const { t, language } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    system_name: '',
    system_short_name: '',
    owner_name: '',
    proprietor_name: '',
    contact_number: '',
    email: '',
    office_address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    currency_symbol: '₹',
  })

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Update form when settings load
  useState(() => {
    if (settings) {
      setFormData({
        system_name: settings.system_name || '',
        system_short_name: settings.system_short_name || '',
        owner_name: settings.owner_name || '',
        proprietor_name: settings.proprietor_name || '',
        contact_number: settings.contact_number || '',
        email: settings.email || '',
        office_address: settings.office_address || '',
        city: settings.city || '',
        state: settings.state || '',
        pincode: settings.pincode || '',
        gst_number: settings.gst_number || '',
        website_url: settings.website_url || '',
        facebook_url: settings.facebook_url || '',
        instagram_url: settings.instagram_url || '',
        twitter_url: settings.twitter_url || '',
        currency_symbol: settings.currency_symbol || '₹',
      })
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      await updateSettings(formData)
      setMessage({ type: 'success', text: language === 'en' ? 'Settings saved successfully!' : 'सेटिंग्स सफलतापूर्वक सहेजी गईं!' })
    } catch (error) {
      setMessage({ type: 'error', text: language === 'en' ? 'Failed to save settings' : 'सेटिंग्स सहेजने में विफल' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    try {
      await uploadLogo(file)
      setMessage({ type: 'success', text: language === 'en' ? 'Logo uploaded!' : 'लोगो अपलोड किया गया!' })
    } catch (error) {
      setMessage({ type: 'error', text: language === 'en' ? 'Failed to upload logo' : 'लोगो अपलोड विफल' })
    }
  }

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setBannerPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    try {
      await uploadBanner(file)
      setMessage({ type: 'success', text: language === 'en' ? 'Banner uploaded!' : 'बैनर अपलोड किया गया!' })
    } catch (error) {
      setMessage({ type: 'error', text: language === 'en' ? 'Failed to upload banner' : 'बैनर अपलोड विफल' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{language === 'en' ? 'Loading settings...' : 'सेटिंग्स लोड हो रही हैं...'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Settings className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'System Preferences' : 'सिस्टम प्राथमिकताएं'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' 
                  ? 'Configure your business information, branding, and system defaults' 
                  : 'अपनी व्यावसायिक जानकारी, ब्रांडिंग और सिस्टम डिफ़ॉल्ट कॉन्फ़िगर करें'}
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <Button onClick={handleSave} disabled={saving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md transition-all">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {language === 'en' ? 'Save Settings' : 'सेटिंग्स सहेजें'}
            </Button>
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3",
          message.type === 'success' 
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
            : "bg-rose-100 text-rose-800 border border-rose-200"
        )}>
          <CheckCircle2 className="h-5 w-5" />
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'Business Information' : 'व्यावसायिक जानकारी'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Basic details about your business' : 'आपके व्यवसाय के बारे में बुनियादी जानकारी'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'System Name' : 'सिस्टम का नाम'} *</FormLabel>
                  <FormInput
                    value={formData.system_name}
                    onChange={(e) => handleInputChange('system_name', e.target.value)}
                    placeholder={language === 'en' ? 'Enter system name' : 'सिस्टम का नाम दर्ज करें'}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'Short Name' : 'छोटा नाम'} *</FormLabel>
                  <FormInput
                    value={formData.system_short_name}
                    onChange={(e) => handleInputChange('system_short_name', e.target.value)}
                    placeholder={language === 'en' ? 'e.g., EMS' : 'जैसे, EMS'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'Owner Name' : 'मालिक का नाम'} *</FormLabel>
                  <FormInput
                    value={formData.owner_name}
                    onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    placeholder={language === 'en' ? 'Enter owner name' : 'मालिक का नाम दर्ज करें'}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'Proprietor Name' : 'प्रोपराइटर का नाम'}</FormLabel>
                  <FormInput
                    value={formData.proprietor_name}
                    onChange={(e) => handleInputChange('proprietor_name', e.target.value)}
                    placeholder={language === 'en' ? 'Enter proprietor name (if different)' : 'प्रोपराइटर का नाम (यदि अलग हो)'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'Contact Number' : 'संपर्क नंबर'}</FormLabel>
                  <FormInput
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    placeholder={language === 'en' ? 'e.g., +91 98765 43210' : 'जैसे, +91 98765 43210'}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'Email Address' : 'ईमेल पता'}</FormLabel>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={language === 'en' ? 'e.g., info@yourbusiness.com' : 'जैसे, info@yourbusiness.com'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'Address Information' : 'पता जानकारी'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Your office location details' : 'आपके कार्यालय का स्थान विवरण'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel>{language === 'en' ? 'Office Address' : 'कार्यालय का पता'}</FormLabel>
                <FormTextarea
                  value={formData.office_address}
                  onChange={(e) => handleInputChange('office_address', e.target.value)}
                  placeholder={language === 'en' ? 'Enter full office address' : 'पूरा कार्यालय पता दर्ज करें'}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'City' : 'शहर'}</FormLabel>
                  <FormInput
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={language === 'en' ? 'City' : 'शहर'}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'State' : 'राज्य'}</FormLabel>
                  <FormInput
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder={language === 'en' ? 'State' : 'राज्य'}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>{language === 'en' ? 'PIN Code' : 'पिन कोड'}</FormLabel>
                  <FormInput
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder={language === 'en' ? 'PIN Code' : 'पिन कोड'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>{language === 'en' ? 'GST Number' : 'जीएसटी नंबर'}</FormLabel>
                <FormInput
                  value={formData.gst_number}
                  onChange={(e) => handleInputChange('gst_number', e.target.value)}
                  placeholder={language === 'en' ? 'e.g., 22AAAAA0000A1Z5' : 'जैसे, 22AAAAA0000A1Z5'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Online Presence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'Online Presence' : 'ऑनलाइन उपस्थिति'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Website and social media links' : 'वेबसाइट और सोशल मीडिया लिंक'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel>{language === 'en' ? 'Website URL' : 'वेबसाइट यूआरएल'}</FormLabel>
                <FormInput
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder={language === 'en' ? 'e.g., https://www.yourbusiness.com' : 'जैसे, https://www.yourbusiness.com'}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <FormLabel>Facebook</FormLabel>
                  <FormInput
                    value={formData.facebook_url}
                    onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                    placeholder="Facebook URL"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Instagram</FormLabel>
                  <FormInput
                    value={formData.instagram_url}
                    onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                    placeholder="Instagram URL"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Twitter</FormLabel>
                  <FormInput
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    placeholder="Twitter URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                  <Currency className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'Currency Settings' : 'मुद्रा सेटिंग्स'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Set your default currency' : 'अपनी डिफ़ॉल्ट मुद्रा सेट करें'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <FormLabel>{language === 'en' ? 'Currency Symbol' : 'मुद्रा प्रतीक'}</FormLabel>
                <FormInput
                  value={formData.currency_symbol}
                  onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                  placeholder={language === 'en' ? 'e.g., ₹, $, €' : 'जैसे, ₹, $, €'}
                  maxLength={3}
                />
                <p className="text-sm text-slate-500">
                  {language === 'en' ? 'Preview: ' : 'पूर्वावलोकन: '}
                  {formatCurrency(1234.56, formData.currency_symbol)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Media Uploads */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'System Logo' : 'सिस्टम लोगो'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Recommended: 200x200px' : 'अनुशंसित: 200x200px'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:from-indigo-50 hover:to-purple-50 transition-all overflow-hidden"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreview || settings?.logo_url ? (
                  <img 
                    src={logoPreview || settings?.logo_url || ''} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">
                      {language === 'en' ? 'Click to upload logo' : 'लोगो अपलोड करने के लिए क्लिक करें'}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Banner Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{language === 'en' ? 'Banner/Cover' : 'बैनर/कवर'}</CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Recommended: 1200x400px' : 'अनुशंसित: 1200x400px'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-rose-400 hover:from-rose-50 hover:to-pink-50 transition-all overflow-hidden"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerPreview || settings?.banner_url ? (
                  <img 
                    src={bannerPreview || settings?.banner_url || ''} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">
                      {language === 'en' ? 'Click to upload banner' : 'बैनर अपलोड करने के लिए क्लिक करें'}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Business Preview' : 'व्यवसाय पूर्वावलोकन'}
              </h3>
              <div className="space-y-2 text-sm text-white/90">
                <p className="font-medium text-white">{formData.system_name || (language === 'en' ? 'Your Business' : 'आपका व्यवसाय')}</p>
                <p>{getFullAddress(settings) || (language === 'en' ? 'Address will appear here' : 'पता यहां दिखाई देगा')}</p>
                <p>{formData.contact_number}</p>
                <p>{formData.email}</p>
                {formData.gst_number && (
                  <p className="text-xs text-white/70">GST: {formData.gst_number}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
