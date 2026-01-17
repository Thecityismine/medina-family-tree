# 🌳 The Medina Family Tree

A beautiful, collaborative family tree application for the Medina family. Built with modern web technologies and designed with a timeless, elegant aesthetic.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Features
- **📸 Photo Uploads** - Add real photos to replace letter avatars
- **🎂 Birthday Calendar** - Never miss a family birthday with countdown badges
- **🗺️ Location Map** - See where family members live around the world
- **🌳 Interactive Family Tree** - Visual tree with generations and relationships
- **🕊️ Deceased Members** - Respectful display with dove icons
- **🐾 Pet Support** - Include family pets in the tree
- **🙏 Godparent Relationships** - Track spiritual family connections
- **🌓 Dark Mode** - Beautiful dark theme with pure black backgrounds
- **📤 Export/Import** - Backup your data as JSON, CSV, or photos

### User Roles
- **Admin** (Jorge & Anseli) - Full control over all family data
- **Family Member** - Edit own profile, add photos
- **Viewer** - Read-only access to family tree

### Mobile Responsive
- Touch-friendly interface
- Swipe-enabled month selector
- Optimized for phones and tablets
- Works offline with PWA capabilities

## 📁 Project Structure

```
medina-family-tree/
├── public/
│   └── index.html          # Main application file
├── src/                    # Future: Separated components (React migration)
├── assets/                 # Future: Images, icons, fonts
├── docs/                   # Documentation
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
├── README.md              # This file
├── DEPLOYMENT.md          # Deployment guide
└── firebase.json          # Firebase configuration
```

## 🚀 Quick Start

### Option 1: Static Hosting (Easiest)

1. **Open Locally**
   ```bash
   # Simply open the file in your browser
   open public/index.html
   ```

2. **Deploy to Vercel** (Recommended)
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd medina-family-tree
   vercel
   ```

3. **Deploy to Netlify**
   - Drag and drop the `public` folder to [netlify.com/drop](https://app.netlify.com/drop)
   - Done! Get your URL instantly

### Option 2: Full Firebase Setup (Backend)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Firebase setup instructions.

## 🎨 Design System

### Colors
**Light Mode:**
- Background: `#FAF9F6` (Cream)
- Text: `#2C2C2C` (Charcoal)
- Accent: `#B8956A` (Aged Gold)

**Dark Mode:**
- Background: `#000000` (Pure Black)
- Cards: `#1C1C1E` (Dark Gray)
- Text: `#F5F5F7` (Bright White)
- Accent: `#B8956A` (Aged Gold)

### Typography
- **Headers:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### Philosophy
Designed as a "family heirloom" - timeless aesthetic that won't feel dated in 10+ years.

## 📸 Screenshots

### Home Dashboard
- Welcome message with family stats
- Quick stats: 15 members, 4 generations, 47 photos, 3 countries
- Upcoming birthdays preview

### Family Tree
- Hierarchical generations with visual connections
- Photo avatars with upload capability
- Godparent badges
- Deceased member indicators

### Birthday Calendar
- Month selector with horizontal swipe
- Birthday cards with countdown badges
- Export to calendar functionality

### Location Map
- Interactive pins showing family locations
- Location cards with country flags
- Distance and timezone calculations

## 🔧 Configuration

### Customization

**Update Family Name:**
```html
<!-- In public/index.html -->
<title>Your Family Name Tree</title>
<h1 class="hero-title">Welcome Home, [Your Name]</h1>
```

**Change Colors:**
```css
/* In <style> section */
:root {
    --aged-gold: #B8956A;  /* Change accent color */
    --forest-green: #4A5D4F;
    --burgundy: #6B3E3E;
}
```

**Add Family Members:**
Edit the person cards in the HTML or connect to Firebase for dynamic data.

## 🗄️ Data Structure

### Firebase Collections (Future)
```javascript
families/medina_family/
  ├── settings/
  ├── members/
  │   ├── jorge_123/
  │   │   ├── name: "Jorge Medina"
  │   │   ├── birthDate: "1990-05-15"
  │   │   ├── location: {...}
  │   │   ├── photoURL: "..."
  │   │   ├── godparents: [...]
  │   │   └── godchildren: [...]
  ├── pets/
  ├── photos/
  └── invitations/
```

## 🎯 Roadmap

### Phase 1 (Current - Static HTML)
- ✅ Beautiful UI/UX
- ✅ Dark mode
- ✅ Photo support
- ✅ All features in demo mode

### Phase 2 (Next - Firebase Backend)
- [ ] User authentication
- [ ] Real-time database
- [ ] Photo storage
- [ ] Invitation system
- [ ] Email notifications

### Phase 3 (Future)
- [ ] React migration
- [ ] Mobile app (React Native)
- [ ] Video memories
- [ ] Family timeline
- [ ] DNA integration
- [ ] Story recordings

## 👥 Users

- **Jorge Medina** - Family Admin
- **Anseli Medina** - Family Admin
- Family members (15+)
- Extended family and friends

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## 🤝 Contributing

This is a private family project. If you're family, ask Jorge or Anseli for access!

## 📄 License

MIT License - Free to use and modify for your own family tree.

## 💡 Inspiration

Inspired by:
- AncestryDNA family trees
- FamilySearch
- MyHeritage
- Modern iOS design principles

## 📞 Support

For issues or questions:
- **Technical:** Contact Jorge
- **Content:** Contact Jorge or Anseli
- **Access:** Request invitation link

## 🎉 Credits

- **Design & Development:** Claude AI + Jorge Medina
- **Family Coordination:** Jorge & Anseli Medina
- **Photos:** Medina Family Members
- **Fonts:** Google Fonts (Playfair Display, Inter)

---

**Built with ❤️ for the Medina Family**

*Last Updated: January 2026*
