-- Seed avatar_library with default kid-friendly avatars
-- Uses DiceBear API for free, reliable SVG avatars

INSERT INTO avatar_library (id, name, image_url, category, tags) VALUES
  -- Animals
  (gen_random_uuid(), 'Happy Bear', 'https://api.dicebear.com/9.x/thumbs/svg?seed=bear&backgroundColor=b6e3f4', 'animals', ARRAY['bear', 'cute']),
  (gen_random_uuid(), 'Cool Cat', 'https://api.dicebear.com/9.x/thumbs/svg?seed=cat&backgroundColor=c0aede', 'animals', ARRAY['cat', 'cool']),
  (gen_random_uuid(), 'Friendly Fox', 'https://api.dicebear.com/9.x/thumbs/svg?seed=fox&backgroundColor=ffdfbf', 'animals', ARRAY['fox', 'friendly']),
  (gen_random_uuid(), 'Brave Lion', 'https://api.dicebear.com/9.x/thumbs/svg?seed=lion&backgroundColor=ffd5dc', 'animals', ARRAY['lion', 'brave']),
  (gen_random_uuid(), 'Wise Owl', 'https://api.dicebear.com/9.x/thumbs/svg?seed=owl&backgroundColor=d1d4f9', 'animals', ARRAY['owl', 'wise']),
  (gen_random_uuid(), 'Playful Panda', 'https://api.dicebear.com/9.x/thumbs/svg?seed=panda&backgroundColor=c0aede', 'animals', ARRAY['panda', 'playful']),

  -- Characters
  (gen_random_uuid(), 'Star Explorer', 'https://api.dicebear.com/9.x/adventurer/svg?seed=star&backgroundColor=b6e3f4', 'characters', ARRAY['explorer', 'star']),
  (gen_random_uuid(), 'Moon Dreamer', 'https://api.dicebear.com/9.x/adventurer/svg?seed=moon&backgroundColor=c0aede', 'characters', ARRAY['dreamer', 'moon']),
  (gen_random_uuid(), 'Sun Chaser', 'https://api.dicebear.com/9.x/adventurer/svg?seed=sun&backgroundColor=ffdfbf', 'characters', ARRAY['chaser', 'sun']),
  (gen_random_uuid(), 'Cloud Rider', 'https://api.dicebear.com/9.x/adventurer/svg?seed=cloud&backgroundColor=ffd5dc', 'characters', ARRAY['rider', 'cloud']),
  (gen_random_uuid(), 'Ocean Surfer', 'https://api.dicebear.com/9.x/adventurer/svg?seed=ocean&backgroundColor=b6e3f4', 'characters', ARRAY['surfer', 'ocean']),
  (gen_random_uuid(), 'Rainbow Dancer', 'https://api.dicebear.com/9.x/adventurer/svg?seed=rainbow&backgroundColor=d1d4f9', 'characters', ARRAY['dancer', 'rainbow']),

  -- Fun Faces
  (gen_random_uuid(), 'Giggles', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=giggles&backgroundColor=b6e3f4', 'fun', ARRAY['happy', 'giggles']),
  (gen_random_uuid(), 'Sparkles', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=sparkles&backgroundColor=ffdfbf', 'fun', ARRAY['sparkle', 'bright']),
  (gen_random_uuid(), 'Sunshine', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=sunshine&backgroundColor=ffd5dc', 'fun', ARRAY['sunny', 'warm']),
  (gen_random_uuid(), 'Bubbles', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=bubbles&backgroundColor=c0aede', 'fun', ARRAY['bubble', 'fun']),
  (gen_random_uuid(), 'Twinkle', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=twinkle&backgroundColor=d1d4f9', 'fun', ARRAY['twinkle', 'star']),
  (gen_random_uuid(), 'Breezy', 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=breezy&backgroundColor=b6e3f4', 'fun', ARRAY['breeze', 'chill'])

ON CONFLICT DO NOTHING;
