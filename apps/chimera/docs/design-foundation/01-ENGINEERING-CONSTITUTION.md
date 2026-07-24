# ⚙️ CHIMERA Engineering Constitution

Version 1.0

This document defines the permanent engineering principles governing CHIMERA and WHISPRR.

---

## SECTION I — PRODUCT PHILOSOPHY & USABILITY

### Rule 1 — Mobile & Desktop First (Mandatory)
- Desktop is NOT the default. Mobile is NOT an afterthought.
- Every feature, UI refactoring, and bug fix must be implemented, tested, and polished for desktop and mobile simultaneously.
- 100% feature parity, responsive layouts, and excellent performance are required on all screen sizes.

### Rule 2 — Users Always Come First
- Every decision must improve the user's experience.
- Never optimize for developer convenience at the expense of usability.

### Rule 3 — Quality Over Speed
- Shipping tomorrow is better than shipping something broken today.
- Never sacrifice polish simply to release faster.

---

## SECTION II — ENGINEERING EXCELLENCE

### Rule 16 — Never Expose Internal Errors
- Users must NEVER see SQL errors, database exceptions, raw stack traces, or console error messages in production.
- Display friendly, actionable error messages with recovery options (Retry / Refresh / Home).

### Rule 18 — Production Means Production
- No TODO placeholders, demo placeholder data, fake online users, or unvetted developer test code in production deployments.

### Rule 20 — Accessibility is Mandatory
- Keyboard navigation, visible focus rings (`focus-visible`), touch targets (44x44px min), screen reader labels, and contrast standards are required.
