# SellerBook — Setup Guide

## Step 1: Node.js Install Karein

1. https://nodejs.org pe jaen
2. "LTS" version download karein (v20 ya v22)
3. Install karein (sab next next click karein)
4. Computer restart karein

## Step 2: Project Folder Kholen

1. Windows Explorer mein jaen: `C:\Users\Dell\seller-crm`
2. Address bar mein type karein: `cmd` → Enter
3. Ya Start menu mein "Command Prompt" dhunden

## Step 3: Dependencies Install Karein

```bash
npm install
```

Thoda waqt lagega (2-5 minutes)

## Step 4: Gemini AI Key Lein (FREE)

1. https://aistudio.google.com/apikey pe jaen
2. Google account se login karein
3. "Create API Key" pe click karein
4. Key copy karein

## Step 5: .env File Update Karein

`.env` file kholen (Notepad se) aur `your-gemini-api-key-here` ki jagah apni key likhein:

```
GEMINI_API_KEY=AIzaSy...aapki-key-yahan
```

## Step 6: Database Setup

```bash
npm run db:push
```

## Step 7: Project Chalayein

```bash
npm run dev
```

Browser mein jaen: http://localhost:3000

---

## Production Deployment (Vercel - Free)

1. https://vercel.com pe free account banayein
2. GitHub pe code upload karein
3. Vercel mein GitHub se connect karein
4. Environment variables add karein (.env wali values)
5. Deploy!

---

## Hostinger MySQL ke liye

.env mein yeh change karein:
```
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
```

Aur prisma/schema.prisma mein:
```
provider = "mysql"
```
Phir `npm run db:push` chalayein.
