-- Replace all avatars with 20 curated, eye-catching options
-- Uses DiceBear API with kid-friendly styles

-- Clear avatar references from child profiles before deleting avatars
UPDATE child_profiles SET avatar_id = NULL WHERE avatar_id IS NOT NULL;
DELETE FROM avatar_library;

INSERT INTO avatar_library (id, name, image_url, category, tags) VALUES

  -- ═══ Adventurers (cute illustrated characters) ═══
  (gen_random_uuid(), 'Captain Brave', 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4&skinColor=f2d3b1', 'adventurers', ARRAY['brave', 'hero']),
  (gen_random_uuid(), 'Luna Star', 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=c0aede&skinColor=ecad80', 'adventurers', ARRAY['star', 'dreamer']),
  (gen_random_uuid(), 'Sky Pilot', 'https://api.dicebear.com/9.x/adventurer/svg?seed=Nolan&backgroundColor=ffdfbf&skinColor=d78b60', 'adventurers', ARRAY['pilot', 'sky']),
  (gen_random_uuid(), 'Rose Explorer', 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc&skinColor=ae5d29', 'adventurers', ARRAY['explorer', 'rose']),
  (gen_random_uuid(), 'Cosmic Kid', 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cosmic&backgroundColor=c0aede&skinColor=ae5d29', 'adventurers', ARRAY['cosmic', 'space']),

  -- ═══ Micah (colourful flat-design characters) ═══
  (gen_random_uuid(), 'Sunny Sam', 'https://api.dicebear.com/9.x/micah/svg?seed=Sam&backgroundColor=b6e3f4', 'micah', ARRAY['sunny', 'cheerful']),
  (gen_random_uuid(), 'Peppy Priya', 'https://api.dicebear.com/9.x/micah/svg?seed=Priya&backgroundColor=c0aede', 'micah', ARRAY['peppy', 'fun']),
  (gen_random_uuid(), 'Lucky Liam', 'https://api.dicebear.com/9.x/micah/svg?seed=Liam&backgroundColor=ffdfbf', 'micah', ARRAY['lucky', 'bright']),
  (gen_random_uuid(), 'Zippy Zoe', 'https://api.dicebear.com/9.x/micah/svg?seed=Zoe&backgroundColor=ffd5dc', 'micah', ARRAY['zippy', 'energetic']),
  (gen_random_uuid(), 'Doodle Dee', 'https://api.dicebear.com/9.x/micah/svg?seed=Dee&backgroundColor=d1d4f9', 'micah', ARRAY['doodle', 'creative']),

  -- ═══ Lorelei (elegant illustrated portraits) ═══
  (gen_random_uuid(), 'Dreamy Aria', 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aria&backgroundColor=ffd5dc', 'portraits', ARRAY['dreamy', 'girl']),
  (gen_random_uuid(), 'Cool Kai', 'https://api.dicebear.com/9.x/lorelei/svg?seed=Kai&backgroundColor=b6e3f4', 'portraits', ARRAY['cool', 'boy']),
  (gen_random_uuid(), 'Sweet Zara', 'https://api.dicebear.com/9.x/lorelei/svg?seed=Zara&backgroundColor=c0aede', 'portraits', ARRAY['sweet', 'girl']),
  (gen_random_uuid(), 'Brave Rio', 'https://api.dicebear.com/9.x/lorelei/svg?seed=Rio&backgroundColor=ffdfbf', 'portraits', ARRAY['brave', 'boy']),
  (gen_random_uuid(), 'Gentle Mia', 'https://api.dicebear.com/9.x/lorelei/svg?seed=Mia&backgroundColor=d1d4f9', 'portraits', ARRAY['gentle', 'girl']),

  -- ═══ Cute Animals (thumbs style) ═══
  (gen_random_uuid(), 'Happy Bear', 'https://api.dicebear.com/9.x/thumbs/svg?seed=bear&backgroundColor=b6e3f4', 'animals', ARRAY['bear', 'cute']),
  (gen_random_uuid(), 'Cool Cat', 'https://api.dicebear.com/9.x/thumbs/svg?seed=cat&backgroundColor=c0aede', 'animals', ARRAY['cat', 'cool']),
  (gen_random_uuid(), 'Friendly Fox', 'https://api.dicebear.com/9.x/thumbs/svg?seed=fox&backgroundColor=ffdfbf', 'animals', ARRAY['fox', 'friendly']),
  (gen_random_uuid(), 'Brave Lion', 'https://api.dicebear.com/9.x/thumbs/svg?seed=lion&backgroundColor=ffd5dc', 'animals', ARRAY['lion', 'brave']),
  (gen_random_uuid(), 'Playful Panda', 'https://api.dicebear.com/9.x/thumbs/svg?seed=panda&backgroundColor=c0aede', 'animals', ARRAY['panda', 'playful'])

ON CONFLICT DO NOTHING;
