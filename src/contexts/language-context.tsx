'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'hi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.contacts': 'Contacts',
    'nav.inventory': 'Inventory',
    'nav.pricing': 'Pricing',
    'nav.events': 'Events',
    'nav.reports': 'Reports',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.noData': 'No data found',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Dashboard
    'dashboard.totalEvents': 'Total Events',
    'dashboard.activeRentals': 'Active Rentals',
    'dashboard.monthlyRevenue': 'Monthly Revenue',
    'dashboard.netProfit': 'Net Profit',
    'dashboard.recentEvents': 'Recent Events',
    'dashboard.inventoryOverview': 'Inventory Overview',
    'dashboard.upcomingBookings': 'Upcoming Bookings',
    'dashboard.viewAll': 'View All',
    
    // Contacts
    'contacts.title': 'Contact Management',
    'contacts.addNew': 'New Contact',
    'contacts.all': 'All Contacts',
    'contacts.vendors': 'Vendors',
    'contacts.renters': 'Renters',
    'contacts.customers': 'Customers',
    'contacts.workers': 'Workers',
    'contacts.name': 'Name',
    'contacts.phone': 'Phone',
    'contacts.email': 'Email',
    'contacts.address': 'Address',
    'contacts.type': 'Type',
    'contacts.search': 'Search contacts...',
    'contacts.noContacts': 'No contacts found',
    
    // Inventory
    'inventory.title': 'Inventory Management',
    'inventory.addNew': 'New Item',
    'inventory.all': 'All Items',
    'inventory.available': 'Available',
    'inventory.rented': 'Rented',
    'inventory.maintenance': 'Maintenance',
    'inventory.lowStock': 'Low Stock',
    'inventory.name': 'Item Name',
    'inventory.category': 'Category',
    'inventory.quantity': 'Quantity',
    'inventory.unit': 'Unit',
    'inventory.uniqueCode': 'Unique Code',
    'inventory.search': 'Search items...',
    'inventory.noItems': 'No items found',
    'inventory.totalItems': 'Total Items',
    'inventory.availableQty': 'Available',
    
    // Pricing
    'pricing.title': 'Rental Pricing',
    'pricing.addNew': 'New Price',
    'pricing.item': 'Item',
    'pricing.dailyRate': 'Daily Rate',
    'pricing.weeklyRate': 'Weekly Rate',
    'pricing.monthlyRate': 'Monthly Rate',
    'pricing.eventRate': 'Per Event',
    'pricing.deposit': 'Security Deposit',
    'pricing.minDays': 'Minimum Days',
    'pricing.maxDays': 'Maximum Days',
    
    // Events
    'events.title': 'Event Management',
    'events.addNew': 'New Event',
    'events.upcoming': 'Upcoming',
    'events.ongoing': 'Ongoing',
    'events.completed': 'Completed',
    'events.cancelled': 'Cancelled',
    'events.customer': 'Customer',
    'events.date': 'Event Date',
    'events.location': 'Location',
    'events.status': 'Status',
    'events.amount': 'Amount',
    'events.items': 'Items',
    'events.workers': 'Workers',
    'events.search': 'Search events...',
    'events.noEvents': 'No events found',
    
    // Reports
    'reports.title': 'Reports & Analytics',
    'reports.profitLoss': 'Profit/Loss Report',
    'reports.inventoryUtilization': 'Inventory Utilization',
    'reports.contactAnalytics': 'Contact Analytics',
    'reports.bookingCapacity': 'Booking Capacity',
    'reports.fromDate': 'From Date',
    'reports.toDate': 'To Date',
    'reports.generate': 'Generate Report',
    
    // Auth
    'auth.loginTitle': 'Login to Your Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.forgotPassword': 'Forgot Password?',
    
    // Settings
    'settings.title': 'System Settings',
    'settings.businessInfo': 'Business Information',
    'settings.systemName': 'System Name',
    'settings.shortName': 'Short Name',
    'settings.ownerName': 'Owner Name',
    'settings.proprietorName': 'Proprietor Name',
    'settings.contact': 'Contact Number',
    'settings.email': 'Email Address',
    'settings.address': 'Address',
    'settings.city': 'City',
    'settings.state': 'State',
    'settings.pincode': 'PIN Code',
    'settings.gstNumber': 'GST Number',
    'settings.logo': 'System Logo',
    'settings.banner': 'Banner/Cover',
    'settings.currency': 'Currency Symbol',
    'settings.preview': 'Preview',
    'settings.save': 'Save Settings',
    'settings.saved': 'Settings saved successfully!',
    'settings.failed': 'Failed to save settings',
    
    // Language
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.switch': 'Switch Language',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.contacts': 'संपर्क',
    'nav.inventory': 'इन्वेंटरी',
    'nav.pricing': 'मूल्य निर्धारण',
    'nav.events': 'ईवेंट्स',
    'nav.reports': 'रिपोर्ट्स',
    'nav.login': 'लॉग इन',
    'nav.logout': 'लॉग आउट',
    
    // Common
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'एडिट',
    'common.add': 'जोड़ें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.loading': 'लोड हो रहा है...',
    'common.noData': 'कोई डेटा नहीं मिला',
    'common.confirm': 'पुष्टि करें',
    'common.close': 'बंद करें',
    'common.submit': 'सबमिट',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    
    // Dashboard
    'dashboard.totalEvents': 'कुल ईवेंट्स',
    'dashboard.activeRentals': 'सक्रिय किराये',
    'dashboard.monthlyRevenue': 'मासिक आय',
    'dashboard.netProfit': 'शुद्ध लाभ',
    'dashboard.recentEvents': 'हाल के ईवेंट्स',
    'dashboard.inventoryOverview': 'इन्वेंटरी अवलोकन',
    'dashboard.upcomingBookings': 'आगामी बुकिंग्स',
    'dashboard.viewAll': 'सभी देखें',
    
    // Contacts
    'contacts.title': 'संपर्क प्रबंधन',
    'contacts.addNew': 'नया संपर्क',
    'contacts.all': 'सभी संपर्क',
    'contacts.vendors': 'विक्रेता',
    'contacts.renters': 'किरायेदार',
    'contacts.customers': 'ग्राहक',
    'contacts.workers': 'कर्मचारी',
    'contacts.name': 'नाम',
    'contacts.phone': 'फ़ोन',
    'contacts.email': 'ईमेल',
    'contacts.address': 'पता',
    'contacts.type': 'प्रकार',
    'contacts.search': 'संपर्क खोजें...',
    'contacts.noContacts': 'कोई संपर्क नहीं मिला',
    
    // Inventory
    'inventory.title': 'इन्वेंटरी प्रबंधन',
    'inventory.addNew': 'नया सामान',
    'inventory.all': 'सभी सामान',
    'inventory.available': 'उपलब्ध',
    'inventory.rented': 'किराए पर',
    'inventory.maintenance': 'मरम्मत में',
    'inventory.lowStock': 'कम स्टॉक',
    'inventory.name': 'सामान का नाम',
    'inventory.category': 'श्रेणी',
    'inventory.quantity': 'मात्रा',
    'inventory.unit': 'इकाई',
    'inventory.uniqueCode': 'यूनिक कोड',
    'inventory.search': 'सामान खोजें...',
    'inventory.noItems': 'कोई सामान नहीं मिला',
    'inventory.totalItems': 'कुल आइटम्स',
    'inventory.availableQty': 'उपलब्ध',
    
    // Pricing
    'pricing.title': 'किराया मूल्य निर्धारण',
    'pricing.addNew': 'नया मूल्य',
    'pricing.item': 'सामान',
    'pricing.dailyRate': 'दैनिक दर',
    'pricing.weeklyRate': 'साप्ताहिक दर',
    'pricing.monthlyRate': 'मासिक दर',
    'pricing.eventRate': 'प्रति ईवेंट',
    'pricing.deposit': 'सुरक्षा जमा',
    'pricing.minDays': 'न्यूनतम दिन',
    'pricing.maxDays': 'अधिकतम दिन',
    
    // Events
    'events.title': 'ईवेंट प्रबंधन',
    'events.addNew': 'नया ईवेंट',
    'events.upcoming': 'आगामी',
    'events.ongoing': 'चल रहा है',
    'events.completed': 'पूर्ण',
    'events.cancelled': 'रद्द',
    'events.customer': 'ग्राहक',
    'events.date': 'ईवेंट तिथि',
    'events.location': 'स्थान',
    'events.status': 'स्थिति',
    'events.amount': 'राशि',
    'events.items': 'सामान',
    'events.workers': 'कर्मचारी',
    'events.search': 'ईवेंट खोजें...',
    'events.noEvents': 'कोई ईवेंट नहीं मिला',
    
    // Reports
    'reports.title': 'रिपोर्ट्स और विश्लेषण',
    'reports.profitLoss': 'लाभ/हानि रिपोर्ट',
    'reports.inventoryUtilization': 'इन्वेंटरी उपयोग',
    'reports.contactAnalytics': 'संपर्क विश्लेषण',
    'reports.bookingCapacity': 'बुकिंग क्षमता',
    'reports.fromDate': 'तिथि से',
    'reports.toDate': 'तिथि तक',
    'reports.generate': 'रिपोर्ट बनाएं',
    
    // Auth
    'auth.loginTitle': 'अपने अकाउंट में लॉग इन करें',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.signIn': 'साइन इन',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    
    // Settings
    'settings.title': 'सिस्टम सेटिंग्स',
    'settings.businessInfo': 'व्यावसायिक जानकारी',
    'settings.systemName': 'सिस्टम का नाम',
    'settings.shortName': 'छोटा नाम',
    'settings.ownerName': 'मालिक का नाम',
    'settings.proprietorName': 'प्रोपराइटर का नाम',
    'settings.contact': 'संपर्क नंबर',
    'settings.email': 'ईमेल पता',
    'settings.address': 'पता',
    'settings.city': 'शहर',
    'settings.state': 'राज्य',
    'settings.pincode': 'पिन कोड',
    'settings.gstNumber': 'जीएसटी नंबर',
    'settings.logo': 'सिस्टम लोगो',
    'settings.banner': 'बैनर/कवर',
    'settings.currency': 'मुद्रा प्रतीक',
    'settings.preview': 'पूर्वावलोकन',
    'settings.save': 'सेटिंग्स सहेजें',
    'settings.saved': 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',
    'settings.failed': 'सेटिंग्स सहेजने में विफल',
    
    // Page Titles
    'page.contacts.title': 'Contact Management',
    'page.contacts.description': 'Manage all types of contacts',
    'page.inventory.title': 'Inventory Management',
    'page.inventory.description': 'List and manage all available inventory',
    'page.events.title': 'Event Management',
    'page.events.description': 'View and manage all events',
    'page.pricing.title': 'Rental Pricing',
    'page.pricing.description': 'Set rental rates for inventory items',
    'page.reports.title': 'Reports & Analytics',
    'page.reports.description': 'Complete business analysis and future capacity',
    'page.settings.title': 'System Settings',
    'page.settings.description': 'Configure your business information and system preferences',
    
    // Language
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.switch': 'भाषा बदलें',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
