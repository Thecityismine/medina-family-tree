# 🚀 Quick Start - The Medina Family Tree

Get your family tree online in 5 minutes!

## ⚡ Fastest Deploy (1 minute)

### Option A: Netlify Drop (No coding required!)

1. Open [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `public` folder
3. Get your URL!

**Your site:** `https://medina-family-tree.netlify.app`

---

### Option B: Vercel (Recommended)

```bash
# 1. Install Vercel
npm install -g vercel

# 2. Deploy
cd medina-family-tree
vercel

# 3. Follow prompts (press Enter for defaults)
```

**Your site:** `https://medina-family-tree.vercel.app`

---

## 📂 What's Included

```
medina-family-tree/
├── public/
│   └── index.html          ← Your complete app
├── README.md               ← Full documentation
├── DEPLOYMENT.md           ← Detailed deployment guide
├── package.json            ← Dependencies
├── firebase.json           ← Firebase config
├── vercel.json            ← Vercel config
└── netlify.toml           ← Netlify config
```

---

## 🎯 Next Steps

### 1. Customize Content

Open `public/index.html` and update:
- Family member names
- Photos (upload real photos)
- Locations
- Birthdays
- Relationships

### 2. Share with Family

Send them your URL:
- `https://medina-family-tree.vercel.app`

Or set up custom domain:
- `https://medinafamilytree.com`

### 3. Add Backend (Optional - Later)

When ready for real-time updates:
- Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
- Set up Firebase
- Enable photo uploads
- Add authentication

---

## 💡 Tips

**Testing Locally:**
```bash
# Simple HTTP server
python -m http.server 8000

# Open: http://localhost:8000/public
```

**Update Your Site:**
```bash
# Vercel
vercel --prod

# Firebase
firebase deploy

# Netlify
netlify deploy --prod
```

**Need Help?**
- Read [README.md](./README.md) for features
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps
- Contact Jorge for support

---

## ✅ That's It!

Your family tree is now live and ready to share with the Medina family! 🎉

**Built with ❤️ for keeping families connected**
