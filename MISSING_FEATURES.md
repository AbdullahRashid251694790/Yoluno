# Missing Features Comparison

## Overview

This document compares the current Yoluno codebase against the reference `yoluno-ai-main` folder to identify missing features and components.

**Current Codebase:** Express backend + React frontend with basic features
**Reference (yoluno-ai-main):** Supabase-powered full-featured platform with 219 source files

---

## 1. Missing Pages

### Public/Marketing Pages
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| About Page | `About.tsx` | - | Missing |
| Blog | `Blog.tsx` | - | Missing |
| Features Overview | `Features.tsx` | - | Missing |
| Pricing Page | `Pricing.tsx` | - | Missing |
| Support Page | `Support.tsx` | - | Missing |
| Safety Info Page | `Safety.tsx` | - | Missing |

### Legal Pages
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| COPPA Compliance | `legal/COPPA.tsx` | - | Missing |
| Privacy Policy | `legal/Privacy.tsx` | - | Missing |
| Terms of Service | `legal/Terms.tsx` | - | Missing |

### Feature Detail Pages
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Family Feature Page | `features/FamilyFeature.tsx` | - | Missing |
| Journeys Feature Page | `features/JourneysFeature.tsx` | - | Missing |
| Learning Feature Page | `features/LearningFeature.tsx` | - | Missing |
| Stories Feature Page | `features/Stories.tsx` | - | Missing |

### Kids Experience Pages
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Kids Entry Point | `KidsEntrypoint.tsx` | - | Missing |
| Kids Launcher | `KidsLauncher.tsx` | - | Missing |
| Kids Profile Selector | `KidsProfileSelector.tsx` | `ChildSelect.tsx` | Partial |
| Journey Marketplace | `JourneyMarketplace.tsx` | - | Missing |
| Learning Page | `Learning.tsx` | - | Missing |

---

## 2. Missing Dashboard Pages

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Dashboard Layout | `dashboard/DashboardLayout.tsx` | `Dashboard.tsx` | Partial |
| Overview | `dashboard/Overview.tsx` | `DashboardHome.tsx` | Partial |
| Content Library | `dashboard/Content.tsx` | - | Missing |
| Family Tree | `dashboard/Family.tsx` | `FamilyTreePage.tsx` | Partial |
| Generate Avatars | `dashboard/GenerateAvatars.tsx` | - | Missing |
| Parent Insights | `dashboard/Insights.tsx` | - | Missing |
| Journey Dashboard | `dashboard/Journeys.tsx` | `JourneysPage.tsx` | Partial |
| Content Library | `dashboard/Library.tsx` | - | Missing |
| Safety Dashboard | `dashboard/Safety.tsx` | `SafetyDashboard.tsx` | Partial |
| Topics Management | `dashboard/Topics.tsx` | - | Missing |
| Voice Vault | `dashboard/VoiceVault.tsx` | - | Missing |

---

## 3. Missing Story Components & Features

### Story Generation
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Bedtime Mode | `BedtimeMode.tsx` | - | Missing |
| Enhanced Story Builder | `EnhancedStoryBuilder.tsx` | - | Missing |
| Stories Library | `StoriesLibrary.tsx` | `StoryList.tsx` | Partial |
| Story Mode | `StoryMode.tsx` | - | Missing |
| Story Mode Header | `StoryModeHeader.tsx` | - | Missing |
| Story Preview | `StoryPreview.tsx` | - | Missing |
| Story Wizard | `StoryWizard.tsx` | `StoryWizard.tsx` | Exists |

### Story Features Missing
- Scene-by-scene illustration generation
- Multiple illustration styles (watercolor, digital-art, pencil-sketch, cartoon)
- Audio narration with multiple voice options (alloy, echo, fable, onyx, nova, shimmer)
- Bedtime mode with auto-play
- Story mood settings (cheerful, calm, adventurous, mysterious, educational)
- Story length options (short, medium, long)
- Story editing and re-generation

---

## 4. Missing Family Tree Features

### Family Components
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Family Tree Builder | `FamilyTreeBuilder.tsx` | `FamilyTreePage.tsx` | Partial |
| Family Tree Flow (React Flow) | `FamilyTreeFlow.tsx` | `FamilyTreeCanvas.tsx` | Partial |
| Create Relationship Dialog | `CreateRelationshipDialog.tsx` | - | Missing |
| Family Events Manager | `FamilyEventsManager.tsx` | - | Missing |
| Family Timeline | `FamilyTimeline.tsx` | - | Missing |
| Member Detail Dialog | `MemberDetailDialog.tsx` | `FamilyMemberDialog.tsx` | Partial |
| Narrative Editor | `NarrativeEditor.tsx` | - | Missing |
| Photo Library Panel | `PhotoLibraryPanel.tsx` | - | Missing |
| Photo Uploader | `PhotoUploader.tsx` | `PhotoUpload.tsx` | Partial |
| Relationship Editor | `RelationshipEditor.tsx` | - | Missing |
| Tree Controls | `TreeControls.tsx` | - | Missing |
| Tree Export Panel | `TreeExportPanel.tsx` | - | Missing |
| Tree Import Dialog | `TreeImportDialog.tsx` | - | Missing |
| Tree Search | `TreeSearch.tsx` | - | Missing |
| Voice Form Recorder | `VoiceFormRecorder.tsx` | `VoiceRecorder.tsx` | Partial |

### Family Features Missing
- Family photo library with AI metadata extraction
- Document scanning and OCR processing
- Audio story recording with transcription
- Export to PNG/JPEG/PDF/JSON
- Import family tree data
- Family timeline view
- Family events management
- Rich text narratives

---

## 5. Missing Learning Journey Features

### Journey Components
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Journey Wizard | `JourneyWizard.tsx` | - | Missing |
| Journey Progress Dashboard | `JourneyProgressDashboard.tsx` | - | Missing |
| Journey Template Selector | `JourneyTemplateSelector.tsx` | - | Missing |
| Journey Reflection Prompt | `JourneyReflectionPrompt.tsx` | - | Missing |
| Goal Journey Manager | `GoalJourneyManager.tsx` | - | Missing |
| Daily Mission Card | `DailyMissionCard.tsx` | - | Missing |
| Journey Onboarding Card | `JourneyOnboardingCard.tsx` | - | Missing |
| Journey Progress Widget | `JourneyProgressWidget.tsx` | - | Missing |
| Journey Share Manager | `JourneyShareManager.tsx` | - | Missing |
| Mission Completion Dialog | `MissionCompletionDialog.tsx` | - | Missing |
| Reflection Dialog | `ReflectionDialog.tsx` | - | Missing |

### Journey Features Missing
- Multi-day learning journeys with daily missions
- AI-generated journey steps based on goals
- Progress tracking with badges and streaks
- Reflection prompts for learning consolidation
- Parent insights and analytics
- Shareable journey templates
- Journey marketplace

---

## 6. Missing Gamification Features

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Badge Display | `BadgeDisplay.tsx` | - | Missing |
| Streak Display | `StreakDisplay.tsx` | - | Missing |

### Gamification Features Missing
- Achievement badge system
- Streak tracking
- Reward mechanisms
- Canvas confetti effects

---

## 7. Missing Chat/Buddy Features

### Chat Components
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Buddy Avatar (animated) | `BuddyAvatar.tsx` | `ChatAvatar.tsx` | Partial |
| Chat Interface | `ChatInterface.tsx` | `ChatContainer.tsx` | Partial |
| Personality Selector | `PersonalitySelector.tsx` | - | Missing |

### Chat Features Missing
- Multiple buddy personalities
- Voice expression animations
- Family context-aware responses
- Personality switching

---

## 8. Missing Kids Mode Features

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| First Time Prompt | `FirstTimePrompt.tsx` | - | Missing |
| Kids PIN Dialog | `KidsPINDialog.tsx` | - | Missing |
| Netflix-style Profile Selector | `NetflixProfileSelector.tsx` | - | Missing |
| PIN Input Grid | `PINInputGrid.tsx` | - | Missing |

### Kids Mode Features Missing
- PIN-based child authentication
- Netflix-style profile selection UI
- First-time user onboarding
- Child-safe mode transitions

---

## 9. Missing Dashboard Management Components

### Content Management
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Content Library | `ContentLibrary.tsx` | - | Missing |
| Content Moderation Log | `ContentModerationLog.tsx` | - | Missing |
| Content Pack Selector | `ContentPackSelector.tsx` | - | Missing |
| Content Preview Drawer | `ContentPreviewDrawer.tsx` | - | Missing |
| Custom Content Editor | `CustomContentEditor.tsx` | - | Missing |
| Story Library | `StoryLibrary.tsx` | `StoryList.tsx` | Partial |

### Topic Management
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Topic Manager | `TopicManager.tsx` | - | Missing |
| Topic Library | `TopicLibrary.tsx` | - | Missing |
| Topic Analytics | `TopicAnalytics.tsx` | - | Missing |
| Topic Pack Editor | `TopicPackEditor.tsx` | - | Missing |
| Topic Review Card | `TopicReviewCard.tsx` | - | Missing |
| Bulk Topic Manager | `BulkTopicManager.tsx` | - | Missing |

### Avatar Management
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Avatar Customizer | `AvatarCustomizer.tsx` | - | Missing |
| Avatar Selector | `AvatarSelector.tsx` | - | Missing |
| Accessories Manager | `AccessoriesManager.tsx` | - | Missing |

### Monitoring & Insights
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Activity Feed | `ActivityFeed.tsx` | - | Missing |
| Child Feedback Panel | `ChildFeedbackPanel.tsx` | - | Missing |
| Engagement Prompts | `EngagementPrompts.tsx` | - | Missing |
| Parent Alerts Panel | `ParentAlertsPanel.tsx` | - | Missing |
| Parent Insights | `ParentInsights.tsx` | - | Missing |
| Session Monitoring Dashboard | `SessionMonitoringDashboard.tsx` | - | Missing |

### Other Dashboard
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Dashboard Hero | `DashboardHero.tsx` | - | Missing |
| Edit Child Profile Dialog | `EditChildProfileDialog.tsx` | - | Missing |
| Enhanced Child Card | `EnhancedChildCard.tsx` | `ChildProfileCard.tsx` | Partial |
| Product Explainer Panel | `ProductExplainerPanel.tsx` | - | Missing |
| Welcome Dialog | `WelcomeDialog.tsx` | - | Missing |
| Child Switcher | `ChildSwitcher.tsx` | - | Missing |

---

## 10. Missing Voice Vault Features

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Voice Vault Manager | `VoiceVaultManager.tsx` | - | Missing |
| Voice Vault Recorder | `VoiceVaultRecorder.tsx` | - | Missing |
| Family Story Recorder | `FamilyStoryRecorder.tsx` | - | Missing |
| Family Story Archive | `FamilyStoryArchive.tsx` | - | Missing |
| Family Document Uploader | `FamilyDocumentUploader.tsx` | - | Missing |
| Family History Manager | `FamilyHistoryManager.tsx` | - | Missing |
| Family History Settings | `FamilyHistorySettings.tsx` | - | Missing |
| Family Photo Library | `FamilyPhotoLibrary.tsx` | - | Missing |

---

## 11. Missing Mode Switching Features

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Bottom Mode Bar | `BottomModeBar.tsx` | - | Missing |
| Desktop Mode Switcher | `DesktopModeSwitcher.tsx` | - | Missing |
| Learning Mode | `LearningMode.tsx` | - | Missing |
| Story Time Mode | `StoryTimeMode.tsx` | - | Missing |
| Mode Context | `ModeContext.tsx` | - | Missing |

---

## 12. Missing Landing Page Components

| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Bright Futures Section | `BrightFuturesSection.tsx` | - | Missing |
| Child Experiences Section | `ChildExperiencesSection.tsx` | - | Missing |
| Features Grid | `FeaturesGrid.tsx` | - | Missing |
| Footer | `Footer.tsx` | - | Missing |
| Gentle Smart Section | `GentleSmartSection.tsx` | - | Missing |
| Hero | `Hero.tsx` | - | Missing |
| Icons | `Icons.tsx` | - | Missing |
| Navigation | `Navigation.tsx` | - | Missing |
| Safety Features Section | `SafetyFeaturesSection.tsx` | - | Missing |
| Testimonials Section | `TestimonialsSection.tsx` | - | Missing |
| Trust Badge | `TrustBadge.tsx` | - | Missing |
| Video Embed | `VideoEmbed.tsx` | - | Missing |
| Wavy CTA Button | `WavyCTAButton.tsx` | - | Missing |
| Shape Images | `shape-images.tsx` | - | Missing |

---

## 13. Missing Supabase Edge Functions

The reference codebase uses Supabase Edge Functions for AI processing. These would need to be reimplemented for the Express backend:

| Function | Purpose | Current Backend Route |
|----------|---------|----------------------|
| `adapt-guardrails` | Dynamic guardrail adaptation | - |
| `analyze-session-patterns` | Session analytics | - |
| `buddy-mission-encouragement` | AI motivational messages | - |
| `check-rate-limit` | Rate limiting | - |
| `child-chat` | AI chat conversations | `/api/buddy-chat` |
| `generate-avatar` | Single avatar generation | `/api/avatars` |
| `generate-avatar-library` | Batch avatar generation | - |
| `generate-enhanced-story` | Advanced story generation | `/api/story/generate` |
| `generate-journey-steps` | AI journey content | `/api/journeys` |
| `generate-story` | Basic story creation | `/api/story/generate` |
| `generate-story-illustrations` | Scene illustrations | - |
| `generate-story-narration` | Audio narration | - |
| `generate-website-image` | Marketing imagery | - |
| `get-family-context` | Family data for AI | `/api/family` |
| `get-guardrail-settings` | Fetch guardrails | `/api/guardrails` |
| `get-reward-voice-clip` | Reward audio clips | - |
| `inject-habit-into-story` | Add learning themes | - |
| `match-content` | Content filtering | - |
| `process-family-document` | Document OCR | - |
| `process-family-photo` | Photo metadata extraction | - |
| `text-to-speech` | TTS conversion | `/api/tts` |
| `transcribe-family-member` | Audio transcription | `/api/transcribe` |
| `transcribe-family-story` | Story transcription | `/api/transcribe` |
| `validate-child-message` | Message validation | - |

---

## 14. Missing Utilities & Hooks

### Library Files
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| Avatar Cache | `avatarCache.ts` | - | Missing |
| Family Tree Layout | `familyTreeLayout.ts` | - | Missing |
| Invite Code Generator | `inviteCodeGenerator.ts` | - | Missing |
| PIN Validation | `pinValidation.ts` | - | Missing |
| Relationship Validation | `relationshipValidation.ts` | - | Missing |
| Story Validation | `storyValidation.ts` | - | Missing |

### Dashboard Hooks
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| useAvatarLibrary | Yes | - | Missing |
| useChildActivities | Yes | - | Missing |
| useChildContext | Yes | `ChildContext.tsx` | Partial |
| useChildPINManagement | Yes | - | Missing |
| useChildProfiles | Yes | `useChildProfiles.ts` | Exists |
| useDashboardGreeting | Yes | - | Missing |
| useGlobalActivity | Yes | - | Missing |
| useGuardrailSettings | Yes | `useGuardrails.ts` | Partial |
| useStories | Yes | `useStories.ts` | Exists |

### Other Hooks
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| useAvatarExpression | Yes | - | Missing |
| useJourneyData | Yes | `useJourneys.ts` | Partial |
| useMobile | Yes | - | Missing |
| useStoryUsage | Yes | - | Missing |
| useTextToSpeech | Yes | - | Missing |

### Contexts
| Feature | yoluno-ai-main | Current | Status |
|---------|----------------|---------|--------|
| KidsAuthContext | Yes | - | Missing |
| ModeContext | Yes | - | Missing |

---

## 15. Missing Special Features Summary

### AI-Powered Features Not Implemented
1. **Story Illustrations** - Scene-by-scene image generation
2. **Audio Narration** - Multiple TTS voice options
3. **Bedtime Mode** - Auto-play story sequences
4. **Photo Processing** - AI metadata extraction from family photos
5. **Document OCR** - Family document scanning
6. **Content Matching** - AI content appropriateness filtering
7. **Journey Generation** - AI-created learning paths
8. **Habit Injection** - Embedding learning themes in stories

### UX Features Not Implemented
1. **PIN Authentication** - Child profile security
2. **Netflix-style Selection** - Profile picker UI
3. **Mode Switching** - Stories/Learning/Chat modes
4. **Family Timeline** - Historical event view
5. **Tree Export** - Multiple format exports
6. **Voice Vault** - Family audio preservation

### Gamification Not Implemented
1. **Badge System** - Achievement tracking
2. **Streak Display** - Engagement metrics
3. **Confetti Effects** - Celebration animations
4. **Mission Rewards** - Completion incentives

---

## Priority Recommendations

### High Priority (Core Experience)
1. Story illustration generation
2. Audio narration with multiple voices
3. Bedtime mode
4. PIN-based child authentication
5. Journey/Mission system

### Medium Priority (Enhanced Features)
1. Family photo/document processing
2. Voice Vault system
3. Gamification (badges, streaks)
4. Parent insights dashboard
5. Topic management system

### Lower Priority (Marketing/Polish)
1. About/Blog/Support pages
2. Pricing page
3. Legal pages (COPPA, Privacy, Terms)
4. Enhanced landing page components
5. Feature detail pages

---

*Generated: December 2024*
*Comparison basis: yoluno-ai-main reference codebase*
