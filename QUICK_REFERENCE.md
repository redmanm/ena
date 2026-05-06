# Multilingual System - Quick Reference Card

## 🚀 Quick Start

### Using Translations in Components

```tsx
import { useLanguage } from '@/lib/language-context';

export function MyComponent() {
  const { t, language } = useLanguage();
  
  return <h1>{t('sidebar.dashboard')}</h1>;
}
```

## 📍 File Locations

| What | Where |
|------|-------|
| English translations | `/locales/en.json` |
| Amharic translations | `/locales/am.json` |
| i18n utilities | `/lib/i18n.ts` |
| Language context | `/lib/language-context.tsx` |
| Language switcher | `/components/language-switcher.tsx` |
| Docs | `/I18N_GUIDE.md` |
| Examples | `/TRANSLATION_EXAMPLES.md` |

## 🎯 Common Translation Keys

### Common
```
common.logout
common.settings
common.profile
common.notifications
common.language
```

### Header
```
header.title           // "ENA Visitor Management System"
header.subtitle        // "Secure Access Control"
header.mobileTitle     // "ENA VMS"
```

### Sidebar
```
sidebar.dashboard
sidebar.allAppointments
sidebar.userManagement
sidebar.auditTrail
sidebar.reports
```

### Login
```
login.title
login.email
login.password
login.loginButton
login.signingIn
```

### Messages
```
messages.success
messages.error
messages.warning
messages.saving
messages.saved
messages.failed
```

## 🔧 Adding a Translation

### Step 1: Edit `/locales/en.json`
```json
{
  "myCategory": {
    "myKey": "My English Text"
  }
}
```

### Step 2: Edit `/locales/am.json`
```json
{
  "myCategory": {
    "myKey": "የእኔ አማርኛ ጽሑፍ"
  }
}
```

### Step 3: Use in Component
```tsx
const { t } = useLanguage();
return <h1>{t('myCategory.myKey')}</h1>;
```

## 🌍 Language Detection

The system automatically detects:
1. **Browser Language** - Navigator language setting
2. **Timezone** - Africa/Addis_Ababa → Amharic
3. **User Preference** - Saved in localStorage
4. **Fallback** - English if no match

## 🎨 Language Switcher

### In Header
```tsx
<LanguageSwitcher />  // Shows EN/AM button
```

### Styling
- Location: Top-right of header
- Style: Translucent button with globe icon
- Languages: English (EN) and Amharic (AM)

## 🌐 Current Language

```tsx
const { language } = useLanguage();

if (language === 'am') {
  // Amharic-specific logic
}
```

## 💾 localStorage Key

```
localStorage.getItem('language')  // Returns 'en' or 'am'
```

## 🎯 Common Patterns

### Conditional Rendering
```tsx
const { t, language } = useLanguage();

return language === 'am' ? (
  <div>Amharic content</div>
) : (
  <div>English content</div>
);
```

### With Fallback
```tsx
const { t } = useLanguage();

return <p>{t('key', 'Default text if missing')}</p>;
```

### Toast Notifications
```tsx
const { t } = useLanguage();

toast({
  title: t('messages.success'),
  description: t('messages.saved'),
});
```

### Form Labels
```tsx
const { t } = useLanguage();

return (
  <label>{t('users.email')}</label>
);
```

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Amharic not showing | Check `html[lang="am"]` is set |
| Language not changing | Clear localStorage, refresh page |
| Translation missing | Add to both en.json and am.json |
| Font not loading | Check Google Fonts in globals.css |

## ✅ Checklist for New Pages

- [ ] Import `useLanguage`
- [ ] Replace hardcoded text with `t('key')`
- [ ] Add translations to both JSON files
- [ ] Test in English
- [ ] Test in Amharic
- [ ] Verify font rendering
- [ ] Check text length doesn't break layout

## 📊 Language Statistics

| Language | Keys | Status |
|----------|------|--------|
| English | 139 | ✅ Complete |
| Amharic | 139 | ✅ Complete |

## 🎓 Resources

- Full Guide: [I18N_GUIDE.md](I18N_GUIDE.md)
- Code Examples: [TRANSLATION_EXAMPLES.md](TRANSLATION_EXAMPLES.md)
- Overview: [MULTILINGUAL_SETUP_SUMMARY.md](MULTILINGUAL_SETUP_SUMMARY.md)

## 🚀 Deployment Notes

- ✅ No environment variables needed
- ✅ No API calls required
- ✅ Works offline
- ✅ Fonts cached by browser
- ✅ Zero latency switching

## 📱 Responsive Support

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile (language button hidden on very small screens)
- ✅ All screen orientations

## ♿ Accessibility

- ✅ Proper lang attributes
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Color contrast maintained

## 🔐 Security

- ✅ No sensitive data in translations
- ✅ XSS-safe
- ✅ Proper encoding
- ✅ Type-safe keys

---

## One-Liners

```tsx
// Get translation
t('key')

// Get translation with fallback
t('key', 'Fallback Text')

// Get current language
language

// Change language
setLanguage('am')
```

---

**Need Help?** See the full documentation in `/I18N_GUIDE.md`
