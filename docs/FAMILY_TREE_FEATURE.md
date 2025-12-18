# Family Tree Feature

A comprehensive feature that allows parents to build a family tree with rich data, enabling Luno (the AI buddy) to answer children's questions about their family members.

## Overview

Parents can:
- Add family members with photos and detailed information
- Use voice recording (Whisper API) to describe photos
- Arrange family members in a visual tree layout
- Store rich context (occupation, hobbies, fun facts) for Luno

Kids can:
- Ask Luno questions like "Who is dad?", "What does grandma do?", "Tell me about uncle John"
- Luno uses the family context to give personalized, accurate answers
- Kids do NOT see a visual family tree - they only interact via chat

---

## Architecture

This feature uses the **Express.js + PostgreSQL** backend running on Railway:

- **Backend**: Express.js API server (`server/`)
- **Database**: PostgreSQL on Railway (schema in `server/migrations/`)
- **File Storage**: Local uploads via Multer (`/api/upload/:bucket`)
- **Speech-to-Text**: OpenAI Whisper API (`/api/transcribe`)
- **AI Chat**: OpenRouter API with Google Gemini 2.5 Flash

---

## Database Schema

The `family_members` table (already exists in `server/migrations/002_initial_schema.sql`):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Parent's user ID |
| `name` | TEXT | Family member's name |
| `relationship_type` | TEXT | Relationship to child (parent, grandparent, etc.) |
| `birth_date` | DATE | Birth date |
| `occupation` | TEXT | Job or profession |
| `hobbies` | TEXT[] | Array of hobbies/interests |
| `fun_facts` | TEXT | Fun facts or stories |
| `connection_description` | TEXT | How they relate to child (e.g., "Dad's sister") |
| `photo_description` | TEXT | Voice-transcribed or text description of the photo |
| `photo_url` | TEXT | URL to uploaded photo |
| `notes` | TEXT | Additional notes/bio |
| `is_alive` | BOOLEAN | Whether member is living |
| `generation_level` | INTEGER | Position in family tree (0=self, 1=parent, 2=grandparent) |
| `position_x` | INTEGER | X position for drag-and-drop tree layout |
| `position_y` | INTEGER | Y position for drag-and-drop tree layout |

---

## Files Structure

### Backend (Express.js)

| File | Description |
|------|-------------|
| [server/src/routes/family.ts](server/src/routes/family.ts) | CRUD API for family members |
| [server/src/routes/buddyChat.ts](server/src/routes/buddyChat.ts) | Buddy chat with family context in system prompt |
| [server/src/routes/upload.ts](server/src/routes/upload.ts) | File upload endpoint (supports `family-photos` bucket) |
| [server/src/routes/transcribe.ts](server/src/routes/transcribe.ts) | OpenAI Whisper API integration |

### Frontend Services

| File | Description |
|------|-------------|
| [src/services/family.ts](src/services/family.ts) | API client for family operations |
| [src/services/whisper.ts](src/services/whisper.ts) | Client service for audio transcription |

### React Query Hooks

| File | Description |
|------|-------------|
| [src/hooks/queries/useFamily.ts](src/hooks/queries/useFamily.ts) | Queries/mutations for family data |
| [src/hooks/useAudioRecorder.ts](src/hooks/useAudioRecorder.ts) | MediaRecorder hook for voice recording |

### UI Components

| File | Description |
|------|-------------|
| [src/components/dashboard/family/FamilyTreePage.tsx](src/components/dashboard/family/FamilyTreePage.tsx) | Main page with tree/list views |
| [src/components/dashboard/family/FamilyTreeCanvas.tsx](src/components/dashboard/family/FamilyTreeCanvas.tsx) | Genealogy tree visualization |
| [src/components/dashboard/family/FamilyMemberNode.tsx](src/components/dashboard/family/FamilyMemberNode.tsx) | Tree node component |
| [src/components/dashboard/family/FamilyMemberCard.tsx](src/components/dashboard/family/FamilyMemberCard.tsx) | List card component |
| [src/components/dashboard/family/FamilyMemberDialog.tsx](src/components/dashboard/family/FamilyMemberDialog.tsx) | Add/edit modal |
| [src/components/dashboard/family/FamilyMemberForm.tsx](src/components/dashboard/family/FamilyMemberForm.tsx) | Form container (uses section components) |
| [src/components/dashboard/family/form/](src/components/dashboard/family/form/) | KISS-compliant form sections |

---

## API Endpoints

### Family Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/family/members` | Get all family members for user |
| GET | `/api/family/members/:id` | Get single family member |
| POST | `/api/family/members` | Create new family member |
| PUT | `/api/family/members/:id` | Update family member |
| DELETE | `/api/family/members/:id` | Delete family member |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/family-photos` | Upload family photo |
| DELETE | `/api/upload/family-photos/:filename` | Delete family photo |

### Transcription

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcribe` | Transcribe audio via Whisper API |

---

## Luno Integration

The buddy chat system prompt ([server/src/routes/buddyChat.ts:266](server/src/routes/buddyChat.ts#L266)) includes family context:

```
FAMILY CONTEXT (use this when the child asks about family members):
John (parent)
  - Relation: Dad
  - Job: Software Engineer
  - Hobbies: Fishing, Hiking, Reading
  - Fun fact: He once caught a 20-pound bass!

Mary (grandparent)
  - Relation: Dad's mother
  - Job: Retired Teacher
  - Hobbies: Gardening, Cooking
  - Fun fact: She makes the best chocolate chip cookies!
  - Note: No longer with us, remembered with love

When the child asks about family (like "Who is dad?", "What does grandma do?"),
use the above information to give accurate, loving answers.
```

---

## Usage

### For Parents

1. Navigate to **Dashboard > Family** tab
2. Click **"Add Family Member"**
3. Fill in details:
   - Basic info (name, relationship, birth year, living status)
   - Connection description (e.g., "Mom's brother")
   - Occupation
   - Hobbies (click suggestions or type custom)
   - Fun facts and stories
   - Upload a photo
   - Record voice description (optional - uses Whisper API)
4. View family in **Tree View** or **List View**
5. Click any member to edit

### For Kids (via Luno Chat)

Kids can ask Luno:
- "Who is dad?"
- "What does grandma do for work?"
- "Tell me about Uncle John"
- "What are mom's hobbies?"
- "Does grandpa like fishing?"

Luno uses the family context to answer accurately and lovingly.

---

## Environment Variables

Required in `server/.env`:

```env
OPENAI_API_KEY=sk-...          # For Whisper transcription
OPENROUTER_API_KEY=sk-or-...   # For Luno AI responses
```

---

## Future Enhancements

- [ ] Drag-and-drop tree positioning with position persistence
- [ ] SVG connection lines between family members
- [ ] Family photo gallery view
- [ ] Import family tree from GEDCOM files
- [ ] Share family tree with other family accounts
