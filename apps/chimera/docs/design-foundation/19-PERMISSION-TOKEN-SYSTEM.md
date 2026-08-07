# 🔐 19 — Permission Token System

Version 1.0

This specification governs Role-Based Access Control (RBAC) and content visibility.

---

## 1. Roles & Content Guards
- **Roles**: `founder`, `admin`, `creator`, `reader`, `moderator`.
- **Content Visibility Options**:
  - `public`: Visible on Discover feed & search results.
  - `unlisted`: Accessible via direct share URL only.
  - `private`: Accessible strictly by the creator.
- **Creator Ownership Protection**: Creators retain ownership rights over their published Characters, Stories, Worlds, and Lorebooks.
