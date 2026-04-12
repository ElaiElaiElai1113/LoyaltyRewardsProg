-- ============================================================
-- Seed Data - Matches current mock store
-- Run with: supabase db reset (includes seed) or manually
-- ============================================================

-- ─── Businesses ──────────────────────────────────────────────

insert into public.businesses (id, name, slug, description, earn_rate, tax_rate, currency, active) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cafe Cliche', 'cafe-cliche', 'A trendy neighborhood cafe known for artisanal coffee and playful twists on classic drinks.', 10, 0.0875, 'USD', true),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Coffee', 'mystic-coffee', 'A mystical coffee experience with ethically sourced beans, herbal infusions, and enchanted blends.', 8, 0.0925, 'USD', true);

-- ─── Demo Users (create via Supabase Auth, then profiles are auto-created) ──
-- After running seed, create these users in Supabase Auth:
--
-- 1. Customer Demo
--    Email: ava@cafecliche.co  Password: demo1234
--    app_metadata: { "role": "customer" }
--
-- 2. Platform Admin
--    Email: admin@loyaltyplatform.co  Password: demo1234
--    app_metadata: { "role": "platform-admin" }
--
-- 3. Cafe Cliche Owner
--    Email: owner@cafecliche.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
--
-- 4. Mystic Coffee Owner
--    Email: owner@mysticcoffee.co  Password: demo1234
--    app_metadata: { "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }

-- ─── Rewards ─────────────────────────────────────────────────

insert into public.rewards (business_id, title, description, category, points_cost, inventory, featured, highlight) values
  -- Cafe Cliche
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Signature Cliche Latte', 'Redeem any handcrafted latte with your choice of milk and syrup.', 'Drink', 250, 99, true, 'Most redeemed this week'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cold Brew Flight', 'Sample three seasonal cold brew profiles in one curated tasting.', 'Experience', 480, 24, true, 'Weekend-only tasting'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Butter Croissant Pairing', 'Fresh-baked croissant paired with any small brewed coffee.', 'Pastry', 180, 44, false, 'Morning favorite'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cafe Cliche Tote', 'Canvas tote with embossed logo and internal bottle sleeve.', 'Merch', 700, 12, false, 'Limited spring merch'),
  -- Mystic Coffee
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Matcha Latte', 'Ceremonial-grade matcha whisked with your choice of milk.', 'Drink', 200, 60, true, 'Fan favorite'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Almond Croissant', 'Flaky croissant filled with almond cream and topped with sliced almonds.', 'Pastry', 160, 30, false, 'Fresh daily'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Afternoon Tea Set', 'Pot of premium herbal tea served with a selection of three mini pastries.', 'Experience', 400, 15, true, 'Weekend special');

-- ─── Products ────────────────────────────────────────────────

insert into public.products (business_id, title, description, category, price, inventory, featured, highlight) values
  -- Cafe Cliche
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Oat Milk Latte', 'Our signature oat milk latte with house-made vanilla syrup.', 'Coffee', 5.50, 200, true, 'Best seller'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cold Brew Concentrate 32oz', 'Take home our 24-hour cold brew concentrate. Dilute to taste.', 'Coffee', 14.00, 50, true, 'Take-home'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pistachio Cardamom Bun', 'Flaky laminated pastry with pistachio frangipane and cardamom glaze.', 'Pastry', 4.75, 30, false, 'Seasonal'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Single Origin: Ethiopia Yirgacheffe', '12oz bag of light-roasted whole beans with floral and citrus notes.', 'Coffee', 18.00, 40, false, 'Direct trade'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cafe Cliche Ceramic Tumbler', '16oz double-walled ceramic tumbler in matte black with silicone lid.', 'Merch', 28.00, 25, true, 'New arrival'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pour-Over Starter Kit', 'Ceramic dripper, 100 filters, and a 12oz sample roast.', 'Equipment', 42.00, 15, false, 'Brew at home'),
  -- Mystic Coffee
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Chai Spice Latte', 'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.', 'Coffee', 5.00, 150, true, 'House blend'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Breakfast Sandwich', 'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.', 'Pastry', 9.50, 40, true, 'Morning staple'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lavender Honey Scone', 'Buttery scone with dried lavender and a honey glaze drizzle.', 'Pastry', 4.25, 35, false, 'Popular'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Premium Tea Sampler', 'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.', 'Coffee', 22.00, 20, false, 'Gift idea'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mystic Coffee Mug', 'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.', 'Merch', 24.00, 18, true, 'Limited edition');

-- ─── Promotions ──────────────────────────────────────────────

insert into public.promotions (business_id, title, description, badge, cta, expires_at, audience) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Double points after 3 PM', 'Stop by after 3 PM and earn twice the points on any handcrafted drink.', 'Weekday perk', 'Drop by after work', '2026-04-24T23:59:59.000Z', 'All members'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Spring pairing menu', 'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.', 'Seasonal', 'Try the pairing', '2026-04-17T23:59:59.000Z', 'All members'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bring-a-friend Saturdays', 'Invite a friend to scan your code in-store and both of you receive a surprise bonus.', 'Referral', 'Share your code', '2026-05-01T23:59:59.000Z', 'All members'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Tea Tuesday Bonus', 'Order any tea on Tuesdays and earn triple points all day.', 'Weekly', 'View teas', '2026-05-15T23:59:59.000Z', 'All members'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Brunch Bundle', 'Get a free pastry when you order any breakfast sandwich before 11 AM.', 'Weekend', 'See menu', '2026-04-30T23:59:59.000Z', 'All members');
