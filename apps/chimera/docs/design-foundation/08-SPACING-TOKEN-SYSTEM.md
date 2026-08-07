# 📐 08 — Spacing Token System

Version 1.0

This specification defines spacing, container widths, and layout density across CHIMERA.

---

## 1. Grid & Spacing Scale (4px Base Unit)
- **xs (`space-1` / 4px)**: Gap between icon and text inside pills.
- **sm (`space-2` / 8px)**: Internal padding for compact badges and buttons.
- **md (`space-4` / 16px)**: Standard card inner padding and form field gap.
- **lg (`space-6` / 24px)**: Page section spacing and modal inner padding.
- **xl (`space-8` / 32px)**: Outer page margin and hero banner padding.

## 2. Locked Container Boundaries
- **Header Navigation (Middle)**: Locked `<nav className="w-[460px] grid grid-cols-5 gap-1">` for 0px visual shift between creative modes.
- **Reader Container**: `max-w-2xl mx-auto px-6` for optimal line length (65–75 characters per line).
- **Modal Container**: `max-w-md` (compact dialogs) / `max-w-lg` (forms) / `max-w-4xl` (workspace drawers).
