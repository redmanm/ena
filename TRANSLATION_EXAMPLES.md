# Translation Usage Examples

This document provides practical examples of how to use translations throughout the ENA system.

## Basic Component Example

### Simple Component with Translations

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';

export function WelcomeCard() {
  const { t } = useLanguage();

  return (
    <div className="p-6 rounded-lg bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-2">
        {t('dashboard.welcome')}
      </h2>
      <p className="text-gray-600 mb-4">
        {t('header.subtitle')}
      </p>
      <Button className="bg-[#00a2ad] hover:bg-[#158798] text-white">
        {t('appointments.create')}
      </Button>
    </div>
  );
}
```

## Form Component Example

### Multilingual Form with Validation

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function UserForm() {
  const { t } = useLanguage();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation with translated error messages
    if (!email) {
      setError(t('messages.error'));
      return;
    }

    // API call
    try {
      // ... API logic
      // Success notification
      alert(t('messages.saved'));
    } catch (err) {
      setError(t('messages.failed'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">
          {t('users.email')}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t('login.email')}
        />
      </div>

      <div>
        <Label htmlFor="name">
          {t('users.name')}
        </Label>
        <Input
          id="name"
          placeholder={t('users.name')}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full">
        {t('messages.saving')}
      </Button>
    </form>
  );
}
```

## Table Component Example

### Multilingual Data Table

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  const { t } = useLanguage();

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {t('users.noUsers')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              {t('users.name')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              {t('users.email')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              {t('users.role')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              {t('users.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(user)}
                >
                  {t('users.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(user.id)}
                >
                  {t('users.delete')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Modal/Dialog Component Example

### Confirmation Dialog with Translations

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('messages.confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('messages.confirmAction')} {itemName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isLoading}>
            {t('appointments.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? t('messages.deleting') : t('users.delete')}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Toast/Notification Example

### Toast Messages with Translations

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/hooks/use-toast';

export function useTranslatedToast() {
  const { t } = useLanguage();
  const { toast } = useToast();

  return {
    success: (message?: string) => {
      toast({
        title: t('messages.success'),
        description: message || t('messages.saved'),
        variant: 'default',
      });
    },
    error: (message?: string) => {
      toast({
        title: t('messages.error'),
        description: message || t('messages.failed'),
        variant: 'destructive',
      });
    },
    warning: (message?: string) => {
      toast({
        title: t('messages.warning'),
        description: message,
      });
    },
    info: (message?: string) => {
      toast({
        title: t('messages.info'),
        description: message,
      });
    },
  };
}

// Usage in a component
export function MyComponent() {
  const toast = useTranslatedToast();

  const handleSave = async () => {
    try {
      // ... API call
      toast.success();
    } catch (error) {
      toast.error(error?.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## Page Component Example

### Full Page with Multiple Translation Sections

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/loading-screen';

interface Department {
  id: string;
  name: string;
  manager: string;
}

export default function DepartmentsPage() {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/departments');
      const data = await response.json();
      setDepartments(data.data || []);
    } catch (err) {
      setError(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {t('departments.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('departments.noDepartments')}
          </p>
        </div>
        <Button className="bg-[#00a2ad] hover:bg-[#158798]">
          {t('departments.addDepartment')}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">
            {t('messages.error')}
          </p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Content */}
      {departments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {t('departments.noDepartments')}
          </p>
          <Button 
            className="mt-4 bg-[#00a2ad] hover:bg-[#158798]"
            onClick={() => {/* navigate to add */}}
          >
            {t('departments.addDepartment')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-4 bg-white rounded-lg border hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
              <p className="text-gray-600 text-sm mb-4">
                <span className="font-medium">{t('departments.manager')}:</span> {dept.manager}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  {t('users.edit')}
                </Button>
                <Button size="sm" variant="destructive">
                  {t('users.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Dynamic Translation with Variables

### Template-Style Translations

While the current system doesn't support variable interpolation in JSON, you can achieve this with a custom helper:

```tsx
'use client';

import { useLanguage } from '@/lib/language-context';

export function useTranslateWithVars() {
  const { t } = useLanguage();

  return (key: string, variables?: Record<string, string>) => {
    let text = t(key);
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`{{${key}}}`, value);
      });
    }
    return text;
  };
}

// Update translation files to use {{variable}} syntax
// Then use like:
const { t } = useLanguage();
const greeting = t('messages.welcome', { name: 'Ahmed' });
// JSON: "messages.welcome": "Welcome, {{name}}!"
```

## Tips for Complex Translations

1. **Avoid Hardcoding Mixed Languages**
   ```tsx
   // ❌ Bad
   return <p>Welcome {userName} - {t('common.logout')}</p>;
   
   // ✅ Good
   return <p>{t('messages.customWelcome', { name: userName })}</p>;
   ```

2. **Use Consistent Translation Keys**
   ```tsx
   // ✅ Good - consistent naming
   t('users.add')
   t('departments.add')
   t('appointments.add')
   ```

3. **Group Related Translations**
   ```json
   {
     "appointments": {
       "title": "Appointments",
       "create": "Create Appointment",
       "edit": "Edit Appointment",
       "delete": "Delete Appointment",
       "noAppointments": "No appointments found"
     }
   }
   ```

4. **Test Both Languages**
   - Switch between languages during testing
   - Verify text lengths (Amharic can be longer)
   - Check font rendering for Amharic

5. **Performance Optimization**
   - Use `useLanguage()` at appropriate component levels
   - Avoid re-rendering entire pages on language change
   - Cache translations when needed
