# Yoluno AI — Project Context for Claude

## What This Is
AI-powered educational platform for children (ages 3-14). Parents manage child profiles, family trees, stories, journeys, and safety. Kids interact with an AI chatbot (Luno) in a character world.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript (port 5174)
- **Backend**: Express + TypeScript, native ESM (port 3000)
- **Database**: PostgreSQL via Docker (`yoluno-db` container)
- **AI**: Google Gemini 2.5 Flash via OpenRouter
- **Deploy**: Railway.app
- **Auth**: JWT with httpOnly refresh cookies

## The Character World
Four characters, each with a role referenced by the chatbot (Luno):
- **Luno** (teal) — the AI chatbot itself, creative, comforting, handles feelings
- **Lala** (gold) — family keeper, referenced when talking about family members
- **Lolo** (orange) — journey guide, referenced for adventures and progress
- **Lumi** (purple) — storyteller, referenced for stories and tales

## Color Scheme (Parent Dashboard)
- Stories = purple (lumi)
- Journeys = orange (lolo)  
- Family = gold (lala)
- Chat/Messages = teal (primary/luno)
- Streaks = gold
- Points = purple (lumi)

## Key Decisions Made
- Chatbot name is hardcoded to "Luno" everywhere — not editable
- Age brackets: 3-6 (playful), 7-9 (balanced), 10-14 (mature)
- AI temperature by age: 0.9 / 0.7 / 0.5
- Daily routine journeys (Morning Routine, Bedtime Hero, etc.) auto-reset each day
- Parent dashboard has white background, colorful gradient cards
- Kids mode is isolated — back button never reaches parent dashboard
- Chat uses optimistic updates for instant message display
- Chat renders markdown (react-markdown + remark-gfm + @tailwindcss/typography)
- Story "Read" button opens overlay reader, doesn't navigate to kids mode
- Data export generates styled HTML report
- Child age capped at 14 (matching landing page FAQ)

## Development Roadmap
See `docs/Yoluno_Development_Roadmap.docx` for the full task list with status.

### Completed (9 of 23)
- Task 3: "Add Post" → "Add Content" label change
- Task 4: AI guardrails for topic generation (age-appropriate, safety rules)
- Task 7: Chatbot name hardcoded to Luno
- Task 8: Open-ended questions enforced in chatbot
- Task 9: Age-based temperature and tone
- Task 10: 4 suggestion buttons colored by character (Story/Learn/Adventure/Family)
- Task 21: IB curriculum — 8 categories, 62 topics added
- Task 22: Chat markdown rendering
- Task 23: Enhanced AI topic generation (structured mini-lessons, 500-1000 words)

### Remaining (14 tasks)
**Phase 1 remaining:**
- Task 11: Rename story voice options to Luno, Lumi, Lolo, Lala
- Task 12: Add "Create New Story" button on kids stories screen
- Task 16: Add journey request button for kids

**Phase 3 (Story Experience):**
- Task 13: Story loading screen with wait message
- Task 14: Notification when story creation is done
- Task 15: Fix story auto-audio and auto-next-page

**Phase 4 (Family Features):**
- Task 1: Multi-media family profiles (continuous photo/video/story addition)
- Task 2: Family notifications on child dashboard + Luno chat prompts
- Task 5: Voice playback for family recordings in Kids UI
- Task 17: Step-parent relationship types in family tree

**Phase 6 (Visual Polish):**
- Task 6: Better avatar options
- Task 18: Remove background from character images on landing
- Task 19: Character poses/angles on landing page
- Task 20: Fix landing page footer

## Important Patterns
- Never push to GitHub unless user says to
- Never add Co-Authored-By lines in commits
- Comment out features instead of deleting code when hiding them
- Always check server compiles with `cd server && npx tsc --noEmit`
- Migrations are sequential numbered SQL files in `server/migrations/`
- The user prefers to discuss plans before implementation
