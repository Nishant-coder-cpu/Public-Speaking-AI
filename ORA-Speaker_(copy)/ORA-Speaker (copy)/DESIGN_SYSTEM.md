# Design System Documentation

This document describes the Tailwind CSS design system configuration for the Public Speaking AI application.

## Overview

The design system is configured in `tailwind.config.js` and provides a consistent set of colors, typography, spacing, and animations throughout the application.

## Color Palette

### Primary Colors (Indigo)

Used for main actions, buttons, and interactive elements.

- `primary-50` to `primary-900`: Full indigo color scale
- Primary action color: `primary-600` (#4f46e5)
- Hover state: `primary-700`

**Usage:**

```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Click Me
</button>
```

### Secondary Colors (Blue)

Used for secondary actions and accents.

- `secondary-50` to `secondary-900`: Full blue color scale
- Secondary action color: `secondary-600` (#2563eb)

**Usage:**

```tsx
<div className="bg-secondary-500 text-white">Secondary Content</div>
```

### Success Colors (Green)

Used for success messages, confirmations, and positive feedback.

- `success-50` to `success-900`: Full green color scale
- Success color: `success-500` (#22c55e)

**Usage:**

```tsx
<div className="bg-success-50 border border-success-200">
  <p className="text-success-600">Upload successful!</p>
</div>
```

### Error Colors (Red)

Used for error messages, warnings, and validation feedback.

- `error-50` to `error-900`: Full red color scale
- Error color: `error-500` (#ef4444)

**Usage:**

```tsx
<div className="bg-error-50 border border-error-200">
  <p className="text-error-600">An error occurred</p>
</div>
```

## Background Gradients

### Primary Gradient

A smooth gradient from indigo to blue, used for hero sections and prominent backgrounds.

**Usage:**

```tsx
<div className="bg-gradient-to-br from-primary-500 to-secondary-600">
  Hero Content
</div>
```

### Gradient Variations

You can create different gradient directions and color combinations:

**Top to Bottom:**

```tsx
<div className="bg-gradient-to-b from-primary-500 to-secondary-600">
  Content
</div>
```

**Left to Right:**

```tsx
<div className="bg-gradient-to-r from-primary-500 to-secondary-600">
  Content
</div>
```

**Diagonal (Bottom-Right):**

```tsx
<div className="bg-gradient-to-br from-primary-500 to-secondary-600">
  Content
</div>
```

## Typography

### Font Sizes

The typography scale includes proper line heights for optimal readability:

- `text-xs`: 0.75rem (12px) - Small labels, captions
- `text-sm`: 0.875rem (14px) - Secondary text, descriptions
- `text-base`: 1rem (16px) - Body text (default)
- `text-lg`: 1.125rem (18px) - Emphasized body text
- `text-xl`: 1.25rem (20px) - Small headings
- `text-2xl`: 1.5rem (24px) - Section headings
- `text-3xl`: 1.875rem (30px) - Page headings
- `text-4xl`: 2.25rem (36px) - Hero headings
- `text-5xl`: 3rem (48px) - Large hero text
- `text-6xl`: 3.75rem (60px) - Extra large hero text

**Usage:**

```tsx
<h1 className="text-4xl font-bold">Main Heading</h1>
<p className="text-base">Body text content</p>
<span className="text-sm text-gray-600">Secondary info</span>
```

## Spacing

### Extended Spacing Utilities

Additional spacing values beyond Tailwind's defaults:

- `spacing-18`: 4.5rem (72px)
- `spacing-88`: 22rem (352px)
- `spacing-100`: 25rem (400px)
- `spacing-112`: 28rem (448px)
- `spacing-128`: 32rem (512px)

**Usage:**

```tsx
<div className="p-18">Extra large padding</div>
<div className="w-100">Fixed width container</div>
```

## Animations

### Fade-In Animation

A smooth fade-in effect with a subtle upward movement.

**Duration:** 0.5 seconds
**Easing:** ease-in-out

**Usage:**

```tsx
<div className="animate-fade-in">This content will fade in smoothly</div>
```

**Animation Details:**

- Starts at 0% opacity, 10px below final position
- Ends at 100% opacity, at final position
- Perfect for cards, modals, and dynamic content

## Responsive Breakpoints

Tailwind's default responsive breakpoints are used:

- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Laptops
- `xl`: 1280px - Desktops
- `2xl`: 1536px - Large desktops

**Usage:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

## Component Patterns

### Upload Box

```tsx
<div
  className="border-2 border-dashed border-gray-300 rounded-lg p-12 
                text-center hover:border-primary-500 transition-colors cursor-pointer"
>
  {/* Upload content */}
</div>
```

### Feedback Card

```tsx
<div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
  <h3 className="text-xl font-bold text-gray-900 mb-4">Title</h3>
  <p className="text-gray-700">Content</p>
  <button
    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md 
                     hover:bg-primary-700 transition-colors"
  >
    Action
  </button>
</div>
```

### Progress Bar

```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
    style={{ width: "60%" }}
  />
</div>
```

### Success Message

```tsx
<div className="p-3 bg-success-50 border border-success-200 rounded-md">
  <p className="text-sm text-success-600">Success message</p>
</div>
```

### Error Message

```tsx
<div className="p-3 bg-error-50 border border-error-200 rounded-md">
  <p className="text-sm text-error-600">Error message</p>
</div>
```

### Button Styles

**Primary Button:**

```tsx
<button
  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 
                   rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
                   focus:ring-offset-2 transition-colors"
>
  Primary Action
</button>
```

**Secondary Button:**

```tsx
<button
  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 
                   rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 
                   focus:ring-primary-500 focus:ring-offset-2 transition-colors"
>
  Secondary Action
</button>
```

## Testing the Design System

A test component is available at `components/DesignSystemTest.tsx` that demonstrates all aspects of the design system. To view it:

1. Import the component in a page
2. Navigate to that page in your browser
3. Resize the window to test responsive breakpoints

## Best Practices

1. **Consistency**: Always use the design system colors instead of arbitrary color values
2. **Accessibility**: Ensure sufficient color contrast (use darker shades for text on light backgrounds)
3. **Responsive Design**: Test all components at different breakpoints
4. **Animations**: Use sparingly for important UI transitions
5. **Spacing**: Use consistent spacing values from the design system
6. **Typography**: Maintain the hierarchy with appropriate font sizes

## Migration Guide

If you have existing components using hardcoded colors, update them as follows:

- `indigo-500` → `primary-500`
- `indigo-600` → `primary-600`
- `blue-500` → `secondary-500`
- `blue-600` → `secondary-600`
- `green-500` → `success-500`
- `green-600` → `success-600`
- `red-500` → `error-500`
- `red-600` → `error-600`
- `from-indigo-500 to-blue-600` → `bg-gradient-primary`

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Responsive Design Testing](https://responsivedesignchecker.com/)
