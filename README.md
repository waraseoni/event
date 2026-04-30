# Events Management System

A complete web-based Events Management System built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Deployed on **Vercel**.

## Features

### संपर्क प्रबंधन (Contact Management)
- **विक्रेता (Vendors)**: लोग जिनसे हम सामान किराए पर लेते हैं
- **किरायेदार (Renters)**: लोग जिन्हें हम अपना सामान किराए पर देते हैं
- **ग्राहक (Customers)**: जिनके लिए ईवेंट्स मैनेज करते हैं
- **कर्मचारी (Workers)**: जो ईवेंट्स में काम करते हैं

### इन्वेंटरी प्रबंधन (Inventory Management)
- सभी उपलब्ध सामान की सूची
- यूनिक कोड और सीरियल नंबर की सुविधा
- मात्रा ट्रैकिंग (कुल, उपलब्ध, किराए पर)
- स्थिति ट्रैकिंग (उपलब्ध, किराए पर, मरम्मत में)

### किराया मूल्य निर्धारण (Rental Pricing)
- दैनिक, साप्ताहिक, मासिक, या प्रति ईवेंट कीमत
- सुरक्षा जमा (Security Deposit)
- न्यूनतम/अधिकतम किराया अवधि
- विशेष दरें (weekend, season)

### ईवेंट प्रबंधन (Event Management)
- ईवेंट बुकिंग और ट्रैकिंग
- ग्राहक विवरण और स्थल पता
- प्रति ईवेंट सामान आवंटन
- किराये की अवधि और मात्रा ट्रैकिंग

### वित्तीय प्रबंधन
- **आय (Income)**: किराये से आय, अन्य सेवाओं से आय
- **व्यय (Expenses)**: बाहरी किराया, कर्मचारी वेतन, अन्य खर्चे
- **लाभ/हानि (Profit/Loss)**: प्रति ईवेंट और समग्र लेखा

### रिपोर्ट्स और विश्लेषण
- मासिक/वार्षिक रिपोर्ट्स
- इन्वेंटरी उपयोग विश्लेषण
- भविष्य की बुकिंग क्षमता कैलकुलेटर
- ग्राहक और विक्रेता विश्लेषण

## Project Structure

```
events-management-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── layout.tsx          # Root Layout
│   │   ├── contacts/           # Contact Management
│   │   ├── inventory/          # Inventory Management
│   │   ├── pricing/            # Rental Pricing
│   │   ├── events/             # Event Management
│   │   ├── reports/            # Reports & Analytics
│   │   ├── auth/login/         # Authentication
│   │   └── globals.css         # Global Styles
│   ├── components/
│   │   ├── ui/                 # Reusable UI Components
│   │   ├── layout/             # Layout Components (Navbar)
│   │   ├── dashboard/          # Dashboard Components
│   │   ├── contacts/           # Contact Components
│   │   ├── inventory/          # Inventory Components
│   │   ├── events/             # Event Components
│   │   ├── pricing/            # Pricing Components
│   │   └── reports/            # Report Components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase Client
│   │   └── utils.ts            # Utility Functions
│   └── types/
│       ├── index.ts            # TypeScript Types
│       └── supabase.ts         # Supabase Database Types
├── supabase/
│   └── schema.sql              # Database Schema
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Setup Instructions

### 1. Supabase Setup

1. **Supabase Account बनाएं**: [supabase.com](https://supabase.com) पर जाएं
2. **New Project बनाएं**: एक नया प्रोजेक्ट बनाएं
3. **Database Schema इम्पोर्ट करें**:
   - Supabase Dashboard में SQL Editor खोलें
   - `supabase/schema.sql` फाइल की सामग्री कॉपी करें
   - SQL Editor में पेस्ट करें और Run करें

4. **API Keys प्राप्त करें**:
   - Settings → API में जाएं
   - `Project URL` और `anon public` key कॉपी करें

### 2. Local Development Setup

```bash
# Dependencies इंस्टॉल करें
npm install

# Environment Variables सेट करें
# .env.local.example को .env.local में कॉपी करें
# अपनी Supabase credentials भरें

# Development Server चलाएं
npm run dev
```

### 3. Vercel पर Deploy करें

```bash
# Vercel CLI इंस्टॉल करें (अगर नहीं है)
npm i -g vercel

# Deploy करें
vercel
```

### Environment Variables (Vercel)

Vercel Dashboard में जाकर Settings → Environment Variables में ये जोड़ें:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema Overview

### Tables:

1. **contacts** - सभी संपर्क (विक्रेता, किरायेदार, ग्राहक, कर्मचारी)
2. **inventory_items** - सामान इन्वेंटरी
3. **pricing_rates** - किराया मूल्य निर्धारण
4. **events** - ईवेंट बुकिंग्स
5. **event_items** - ईवेंट में उपयोग किया गया सामान
6. **external_rentals** - बाहर से किराए पर लिया सामान
7. **worker_assignments** - ईवेंट में कर्मचारी नियुक्ति
8. **payments** - सभी वित्तीय लेनदेन

## Usage Guide

### नया संपर्क जोड़ें
1. "संपर्क" मेनू पर जाएं
2. "नया संपर्क" बटन पर क्लिक करें
3. प्रकार चुनें (विक्रेता/किरायेदार/ग्राहक/कर्मचारी)
4. विवरण भरें और Save करें

### सामान जोड़ें
1. "इन्वेंटरी" मेनू पर जाएं
2. "नया सामान" बटन पर क्लिक करें
3. नाम, कैटेगरी, मात्रा भरें
4. यूनिक कोड ऑटो-जनरेट होगा
5. Save करें

### ईवेंट बनाएं
1. "ईवेंट्स" मेनू पर जाएं
2. "नया ईवेंट" बटन पर क्लिक करें
3. ग्राहक चुनें या नया ग्राहक जोड़ें
4. तारीख और स्थान भरें
5. आवश्यक सामान जोड़ें
6. किराया स्वचालित रूप से गणना होगा

### रिपोर्ट्स देखें
1. "रिपोर्ट्स" मेनू पर जाएं
2. लाभ/हानि रिपोर्ट देखें
3. इन्वेंटरी उपयोग विश्लेषण
4. भविष्य की बुकिंग क्षमता

## Additional Features Recommended

मैंने आपके लिए ये अतिरिक्त सुविधाएं सुझाई हैं:

1. **Multi-user Support** - अलग-अलग रोल्स (Admin, Manager, Staff)
2. **SMS Notifications** - ईवेंट रिमाइंडर्स और कन्फर्मेशन
3. **Document Management** - करार पत्र, इनवॉइस, रसीदें
4. **Calendar Integration** - Google Calendar sync
5. **Photo Gallery** - ईवेंट या सामान की फोटोज
6. **Maintenance Scheduler** - सामान की मरम्मत शेड्यूलिंग
7. **Barcode/QR Scanner** - Inventory management के लिए
8. **Multi-location** - अलग-अलग गोदाम/स्टोर लोकेशन
9. **Customer Portal** - ग्राहक अपने ईवेंट देख सकें
10. **Expense Categories** - विस्तृत खर्च की कैटेगरीज

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Support

किसी भी समस्या या सवाल के लिए, कृपया issue बनाएं या संपर्क करें।

---

**Built with ❤️ for Event Management Businesses**
