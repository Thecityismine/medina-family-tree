# 🚀 Deployment Guide - The Medina Family Tree

Complete instructions for deploying your family tree application.

## 📋 Table of Contents

1. [Quick Deploy (5 minutes)](#quick-deploy)
2. [Vercel Deployment](#vercel-deployment)
3. [Firebase Hosting](#firebase-hosting)
4. [Netlify Deployment](#netlify-deployment)
5. [Custom Domain Setup](#custom-domain)
6. [Firebase Backend Setup](#firebase-backend)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Deploy (5 minutes)

### Option 1: Netlify Drop (Easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `public` folder onto the page
3. Get your URL: `https://medina-family-tree.netlify.app`
4. Done! ✅

**Pros:**
- Instant deployment
- Free SSL certificate
- No CLI required
- Auto-updates via Git (optional)

---

## 🚀 Vercel Deployment (Recommended)

Vercel is recommended for its speed, reliability, and ease of use.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd medina-family-tree
vercel
```

### Step 3: Answer Prompts

```
? Set up and deploy "medina-family-tree"? Y
? Which scope? Your Name
? Link to existing project? N
? What's your project's name? medina-family-tree
? In which directory is your code located? ./
? Want to override settings? N
```

### Step 4: Get Your URL

```
✅ Production: https://medina-family-tree.vercel.app
```

### Custom Domain on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Add domain: `medinafamilytree.com`
5. Follow DNS instructions

**Estimated time:** 15 minutes

---

## 🔥 Firebase Hosting

Perfect if you plan to add Firebase backend later.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Project

```bash
cd medina-family-tree
firebase init hosting
```

Answer prompts:
```
? Select a default Firebase project: Create new project
? What do you want to use as your public directory? public
? Configure as a single-page app? Yes
? Set up automatic builds with GitHub? No
? File public/index.html already exists. Overwrite? No
```

### Step 4: Deploy

```bash
firebase deploy --only hosting
```

### Step 5: Get Your URL

```
✅ Hosting URL: https://medina-family-tree.web.app
```

**Estimated time:** 20 minutes

---

## 🎨 Netlify Deployment (via Git)

### Step 1: Push to GitHub

```bash
cd medina-family-tree
git init
git add .
git commit -m "Initial commit - Medina Family Tree"
git branch -M main
git remote add origin https://github.com/yourusername/medina-family-tree.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub**
4. Select `medina-family-tree` repository
5. Configure:
   - **Build command:** (leave empty)
   - **Publish directory:** `public`
6. Click **Deploy site**

### Step 3: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter: `medinafamilytree.com`
4. Follow DNS setup instructions

**Estimated time:** 25 minutes

---

## 🌐 Custom Domain Setup

### Buy Domain

**Recommended registrars:**
- **Namecheap:** $10-12/year (cheap, reliable)
- **Google Domains:** $12/year (easy to use)
- **Cloudflare:** $9-10/year (best value)

**Suggested domains:**
- `medinafamilytree.com`
- `medinafamily.app`
- `familiamedina.com`

### DNS Configuration

#### For Vercel:

**Add DNS records at your registrar:**
```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### For Firebase:

```
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195

Type: CNAME
Name: www
Value: medina-family-tree.web.app
```

#### For Netlify:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: medina-family-tree.netlify.app
```

**DNS propagation:** 1-48 hours (usually 1-2 hours)

---

## 🗄️ Firebase Backend Setup (Optional - Phase 2)

For when you're ready to add real-time database, authentication, and storage.

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name: `medina-family-tree`
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Enable Services

**Firestore Database:**
1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select location: `us-central1`

**Authentication:**
1. Go to **Build** → **Authentication**
2. Click **Get started**
3. Enable **Email/Password**
4. Enable **Google** (optional)

**Storage:**
1. Go to **Build** → **Storage**
2. Click **Get started**
3. Use default security rules
4. Click **Done**

### Step 3: Get Firebase Config

1. Go to **Project settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web** icon (</>)
4. Register app: `Medina Family Tree`
5. Copy the config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "medina-family-tree.firebaseapp.com",
  projectId: "medina-family-tree",
  storageBucket: "medina-family-tree.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Add to Your App

Create `src/firebase-config.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Paste your config here
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### Step 5: Security Rules

**Firestore** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId}/members/{memberId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data.role == 'admin'
                   || request.auth.uid == memberId);
    }
  }
}
```

**Storage** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /familyPhotos/{familyId}/{memberId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.resource.size < 5 * 1024 * 1024 && // 5MB
                   request.resource.contentType.matches('image/.*');
    }
  }
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Step 6: Cost Estimate

**Free Tier (Spark Plan):**
- Firestore: 1GB storage, 50K reads/day, 20K writes/day
- Storage: 5GB, 1GB/day downloads
- Hosting: 10GB/month, 360MB/day
- **Perfect for family use! ($0/month)**

**Paid Tier (if needed):**
- ~$1-5/month for active family of 50 people

---

## 🔧 Environment Setup

### Development

```bash
# Serve locally
python -m http.server 8000
# Open http://localhost:8000/public
```

Or use VS Code Live Server extension.

### Production

All hosting providers auto-minify and optimize your files.

---

## 📊 Monitoring

### Vercel Analytics
- Free built-in analytics
- View at: [vercel.com/your-project/analytics](https://vercel.com)

### Firebase Analytics
- Add to Firebase console
- Track user behavior
- Monitor app health

### Google Analytics
Add to `<head>` in `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🐛 Troubleshooting

### Issue: Page Shows Blank

**Solution:**
1. Check browser console for errors (F12)
2. Ensure `index.html` is in `public` folder
3. Clear browser cache (Ctrl+Shift+R)

### Issue: Dark Mode Not Working

**Solution:**
1. Check if theme toggle is working
2. Verify localStorage is enabled
3. Try in incognito mode

### Issue: Photos Not Uploading

**Solution (with Firebase):**
1. Check Storage rules
2. Verify file size < 5MB
3. Ensure user is authenticated

### Issue: Slow Loading

**Solution:**
1. Optimize images (compress to 200KB)
2. Enable CDN on hosting provider
3. Use lazy loading for images

### Issue: Domain Not Working

**Solution:**
1. Wait 1-48 hours for DNS propagation
2. Verify DNS records at [dnschecker.org](https://dnschecker.org)
3. Check SSL certificate (may take 24 hours)

---

## 📞 Support

**Hosting Issues:**
- Vercel: [vercel.com/support](https://vercel.com/support)
- Firebase: [firebase.google.com/support](https://firebase.google.com/support)
- Netlify: [netlify.com/support](https://netlify.com/support)

**Domain Issues:**
- Check registrar support docs
- Use registrar's DNS checker

**App Issues:**
- Check browser console
- Review code in `public/index.html`
- Contact Jorge

---

## ✅ Deployment Checklist

Before going live:

- [ ] Test on multiple devices
- [ ] Verify all links work
- [ ] Check mobile responsiveness
- [ ] Test dark mode
- [ ] Verify photos load
- [ ] Check all sections
- [ ] Test birthday calendar month switching
- [ ] Verify location map displays correctly
- [ ] Add custom domain (optional)
- [ ] Set up Google Analytics (optional)
- [ ] Create family invitation links
- [ ] Share with family!

---

**Deployment Complete! 🎉**

Your Medina Family Tree is now live and accessible to your family worldwide.

*Estimated total time: 15-30 minutes*
*Cost: $0-12/year (domain only)*
