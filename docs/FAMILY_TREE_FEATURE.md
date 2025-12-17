# Family Tree Feature

A comprehensive feature that allows parents to build a family tree with rich data, enabling the AI buddy to answer children's questions about their family members.

## Overview

Parents can:
- Add family members with photos and detailed information
- Use voice recording (Whisper API) to describe photos
- Arrange family members in a visual tree layout
- Store rich context (occupation, hobbies, fun facts) for the AI buddy

Kids can:
- Ask the buddy questions like "Who is dad?", "What does grandma do?", "Tell me about uncle John"
- The buddy uses the family context to give personalized, accurate answers

---

## Files Created/Modified

### Database Migration
| File | Status | Description |
|------|--------|-------------|
| `supabase/migrations/20241217_family_tree_enhancements.sql` | NEW | Adds columns to `family_members` table |

**New Columns:**
- `occupation` (text) - Job or profession
- `hobbies` (text[]) - Array of hobbies/interests
- `fun_facts` (text) - Fun facts or stories
- `connection_description` (text) - How they relate to child (e.g., "Dad's sister")
- `photo_description` (text) - Voice-transcribed photo description
- `generation_level` (integer) - Position in family tree
- `position_x`, `position_y` (integer) - Drag-drop positioning

### Edge Functions
| File | Status | Description |
|------|--------|-------------|
| `supabase/functions/transcribe-audio/index.ts` | NEW | OpenAI Whisper API integration for voice-to-text |
| `supabase/functions/buddy-chat/index.ts` | MODIFIED | Enhanced system prompt with rich family context |

### Services
| File | Status | Description |
|------|--------|-------------|
| `src/services/family.ts` | MODIFIED | Added `uploadFamilyPhoto()`, `deleteFamilyPhoto()`, `updateTreePositions()` |
| `src/services/whisper.ts` | NEW | Client service for audio transcription |

### Types
| File | Status | Description |
|------|--------|-------------|
| `src/integrations/supabase/types.ts` | MODIFIED | Added new column types to `family_members` |
| `src/types/domain.ts` | MODIFIED | Extended `FamilyMember` interface |
| `src/types/forms.ts` | MODIFIED | Extended `createFamilyMemberSchema` with new fields |

### React Query Hooks
| File | Status | Description |
|------|--------|-------------|
| `src/hooks/queries/useFamily.ts` | MODIFIED | Added `useUploadFamilyPhoto()`, `useDeleteFamilyPhoto()`, `useUpdateTreePositions()` |
| `src/hooks/useAudioRecorder.ts` | NEW | MediaRecorder hook for voice recording |

### UI Components
| File | Status | Description |
|------|--------|-------------|
| `src/components/dashboard/family/index.ts` | NEW | Barrel export |
| `src/components/dashboard/family/FamilyTreePage.tsx` | NEW | Main page with tree/list views |
| `src/components/dashboard/family/FamilyTreeCanvas.tsx` | NEW | Genealogy tree visualization |
| `src/components/dashboard/family/FamilyMemberNode.tsx` | NEW | Tree node component |
| `src/components/dashboard/family/FamilyMemberCard.tsx` | NEW | List card component |
| `src/components/dashboard/family/FamilyMemberDialog.tsx` | NEW | Add/edit modal |
| `src/components/dashboard/family/FamilyMemberForm.tsx` | NEW | Rich form with all fields |
| `src/components/dashboard/family/PhotoUpload.tsx` | NEW | Drag-and-drop photo upload |
| `src/components/dashboard/family/VoiceRecorder.tsx` | NEW | Voice recording with transcription |

### Dashboard Integration
| File | Status | Description |
|------|--------|-------------|
| `src/pages/Dashboard.tsx` | MODIFIED | Added "Family" tab and route |

---

## Setup Steps

### Step 1: Run Database Migration

Go to **Supabase SQL Editor**: https://supabase.com/dashboard/project/zsbtowudmhwaipnjmbcr/sql/new

Run this SQL:

```sql
-- Add new columns to family_members
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS hobbies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fun_facts text,
ADD COLUMN IF NOT EXISTS connection_description text,
ADD COLUMN IF NOT EXISTS photo_description text,
ADD COLUMN IF NOT EXISTS generation_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_x integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN family_members.occupation IS 'Job or profession of the family member';
COMMENT ON COLUMN family_members.hobbies IS 'Array of hobbies and interests';
COMMENT ON COLUMN family_members.fun_facts IS 'Fun facts or stories about the family member';
COMMENT ON COLUMN family_members.connection_description IS 'How this person relates to the child';
COMMENT ON COLUMN family_members.photo_description IS 'Voice-transcribed or text description of the photo';
COMMENT ON COLUMN family_members.generation_level IS 'Generation in family tree (0=self, 1=parent, 2=grandparent)';
COMMENT ON COLUMN family_members.position_x IS 'X position for drag-and-drop tree layout';
COMMENT ON COLUMN family_members.position_y IS 'Y position for drag-and-drop tree layout';
```

### Step 2: Create Storage Bucket

Go to **Supabase Storage**: https://supabase.com/dashboard/project/zsbtowudmhwaipnjmbcr/storage/buckets

1. Click **"New bucket"**
2. Name: `family-photos`
3. Check **"Public bucket"**
4. Click **"Create bucket"**

Then run this SQL to add storage policies:

```sql
-- Storage policies for family-photos bucket
CREATE POLICY "Public read access for family photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'family-photos');

CREATE POLICY "Authenticated users can upload family photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'family-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own family photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own family photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 3: Deploy Edge Function

**Option A: Using Supabase CLI (recommended)**

```bash
# Login to Supabase CLI
npx supabase login

# Deploy the function
npx supabase functions deploy transcribe-audio --project-ref zsbtowudmhwaipnjmbcr
```

**Option B: Via Supabase Dashboard**

1. Go to **Edge Functions**: https://supabase.com/dashboard/project/zsbtowudmhwaipnjmbcr/functions
2. Click **"New Function"**
3. Name: `transcribe-audio`
4. Copy contents from `supabase/functions/transcribe-audio/index.ts`

### Step 4: Verify Environment Variables

Ensure these are set in your Supabase project (Settings > Edge Functions):
- `OPENAI_API_KEY` - Required for Whisper transcription

---

## Usage

### For Parents

1. Navigate to **Dashboard > Family** tab
2. Click **"Add Family Member"**
3. Fill in details:
   - Basic info (name, relationship, birth year)
   - Connection description (e.g., "Mom's brother")
   - Occupation
   - Hobbies (click suggestions or type custom)
   - Fun facts and stories
   - Upload a photo
   - Record voice description (optional)
4. View family in **Tree View** or **List View**
5. Click any member to edit

### For Kids (via Buddy Chat)

Kids can ask the buddy:
- "Who is dad?"
- "What does grandma do for work?"
- "Tell me about Uncle John"
- "What are mom's hobbies?"
- "Does grandpa like fishing?"

The buddy will use the family context to answer accurately.

---

## Technical Details

### Buddy Chat Integration

The `buddy-chat` edge function now builds a rich family context:

```
FAMILY CONTEXT:
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
```

### Voice Recording Flow

1. Parent clicks "Record Voice" in the photo description section
2. `useAudioRecorder` hook captures audio via MediaRecorder API (WebM format)
3. Recording is sent to `transcribe-audio` edge function
4. Edge function calls OpenAI Whisper API
5. Transcribed text is returned and saved to `photo_description`

---

## Future Enhancements

- [ ] Drag-and-drop tree positioning with position persistence
- [ ] SVG connection lines between family members
- [ ] Family photo gallery view
- [ ] Import family tree from GEDCOM files
- [ ] Share family tree with other family accounts
