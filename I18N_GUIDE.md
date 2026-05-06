# Internationalization (i18n) Guide - ENA Visitor Management System

This guide explains how to use the multilingual system with English and Amharic language support.

## Overview

The ENA system now supports full multilingual functionality with:
- **English (en)** - Default language
- **Amharic (am)** - Ethiopian language with proper Amharic font support
- **Language Switching** - Easy language toggle in the header
- **Browser Detection** - Automatic detection of browser language and timezone
- **Local Storage** - User language preference is saved

## File Structure

```
/locales
  ├── en.json          # English translations
  └── am.json          # Amharic translations

/lib
  ├── i18n.ts          # Core i18n utilities and language detection
  ├── language-context.tsx  # React context for language state management

/components
  └── language-switcher.tsx # Language toggle component

/app/globals.css       # Amharic font configuration
```

## How to Use Translations

### In Client Components

Use the `useLanguage()` hook to access translations:

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';

export function MyComponent() {
  const { t, language } = useLanguage();

  return (
    <div>
      <h1>{t('sidebar.dashboard')}</h1>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Translation Key Structure

Translation keys follow a dot-notation pattern:

```
category.key
category.subcategory.key
```

Examples:
- `header.title` → "ENA Visitor Management System" (English) / "ENA - ጎብኚ አስተዳደር ስርዓት" (Amharic)
- `common.logout` → "Logout" (English) / "ወደ ውጪ ይግቡ" (Amharic)
- `messages.success` → "Success" (English) / "ስኖታ" (Amharic)

## Available Translation Categories

### Common Translations
- `common.logout`
- `common.settings`
- `common.profile`
- `common.notifications`
- `common.language`
- `common.english`
- `common.amharic`

### Header
- `header.title`
- `header.subtitle`
- `header.mobileTitle`

### Sidebar
- `sidebar.dashboard`
- `sidebar.allAppointments`
- `sidebar.userManagement`
- `sidebar.auditTrail`
- *(and many more)*

### Login Page
- `login.title`
- `login.email`
- `login.password`
- `login.loginButton`
- `login.signingIn`

### Dashboard
- `dashboard.welcome`
- `dashboard.totalUsers`
- `dashboard.appointments`
- *(and more)*

### Messages
- `messages.success`
- `messages.error`
- `messages.warning`
- `messages.loading`
- `messages.saved`
- `messages.deleted`

## Adding New Translations

### Step 1: Add to English Translations

Edit `/locales/en.json`:

```json
{
  "myCategory": {
    "myKey": "My English Text"
  }
}
```

### Step 2: Add to Amharic Translations

Edit `/locales/am.json`:

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

## Language Switching Behavior

### User Preference Storage
- Language preference is automatically saved to `localStorage` with key `language`
- On subsequent visits, the user's chosen language is restored

### Browser Language Detection
The system automatically detects the user's language based on:
1. **Browser Language** - Checks if browser language is Amharic (`am`)
2. **Timezone Detection** - If user is in Ethiopia (`Africa/Addis_Ababa`), defaults to Amharic
3. **Fallback** - Defaults to English if none of the above match

### Manual Language Selection
Users can switch languages using the **Language Switcher** button in the top-right corner of the header.

## Component Integration

### Language Switcher Component

The `<LanguageSwitcher />` component is placed in:
- Header (desktop view) - Top-right corner
- Login page - Top-right corner of login form

Usage:
```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

export function MyLayout() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## Font Support

### Amharic Font Configuration

The system uses **Noto Serif Ethiopic** font from Google Fonts for proper Amharic text rendering.

The font is:
- Automatically loaded via `@import` in `/app/globals.css`
- Applied only when `html[lang="am"]` is set
- Supports all Amharic characters and diacritics

### Font Features
- Clear, readable serif font designed for Ethiopic scripts
- Multiple font weights (400, 500, 600, 700)
- Optimized for screen display and readability

## HTML Language Attribute

The `<html>` element's `lang` attribute is automatically updated:

```html
<!-- English -->
<html lang="en" dir="ltr">

<!-- Amharic -->
<html lang="am" dir="ltr">
```

Note: Both languages use LTR (Left-to-Right) text direction. Amharic is naturally LTR.

## Fallback Behavior

If a translation key is missing:
1. The system returns an empty string by default
2. You can provide a fallback value:

```tsx
const { t } = useLanguage();

// Returns empty string if not found
t('nonexistent.key')

// Returns provided default value if not found
t('nonexistent.key', 'Default Text')
```

## Testing Translations

To test the multilingual system:

1. **Switch Languages**
   - Click the language button in the header
   - Page content updates in real-time
   - Language preference is saved

2. **Browser Language Detection**
   - Change browser language settings
   - Refresh the page
   - System should detect and apply the appropriate language

3. **Check Storage**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Look for `language` key
   - Value should be `"en"` or `"am"`

## Best Practices

### ✅ Do's
- Always use `t('key')` for user-facing text
- Organize translations logically by category
- Use descriptive key names
- Keep translation files in sync between languages
- Test on different browser language settings

### ❌ Don'ts
- Hardcode text strings in components
- Forget to add translations for both languages
- Use special characters that may not render in Amharic
- Mix translation and untranslated text in the same component

## Common Issues and Solutions

### Issue: Amharic Text Not Displaying
**Solution:**
- Ensure the Noto Serif Ethiopic font is loaded (check Network tab)
- Verify `html[lang="am"]` is set on the `<html>` element
- Check that Amharic JSON file has proper Unicode encoding

### Issue: Language Not Changing
**Solution:**
- Check browser console for errors
- Verify language context is wrapped around components
- Clear browser cache and localStorage

### Issue: Translation Missing
**Solution:**
- Add the translation to both `en.json` and `am.json`
- Use correct dot-notation key path
- Verify no typos in the key name

## Performance Considerations

- Translations are loaded at build time (no runtime loading)
- Language switching is instant (no network requests)
- Locale files are minified in production
- Font loading is optimized with Google Fonts CDN

## Accessibility

- All UI elements have proper `lang` attributes
- Screen readers respect the `lang` attribute for proper pronunciation
- Language switcher is keyboard accessible
- Font sizes and contrast ratios are maintained across both languages

## Future Enhancements

Potential improvements for the i18n system:
- Additional language support (French, Arabic, etc.)
- Right-to-Left (RTL) layout support for Arabic
- Pluralization rules for different languages
- Date/time formatting by locale
- Currency formatting by region
- Translation management dashboard for admins

## Support

For issues or questions about the i18n system:
1. Check this guide first
2. Review the translation JSON files for examples
3. Check the console for error messages
4. Verify all components are wrapped with `LanguageProvider`
