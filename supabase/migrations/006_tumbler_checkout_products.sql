insert into products (slug, name, description, price, category, collection_name, material, colors, images, status, inventory_quantity, low_stock_threshold, featured, best_seller, is_active, sort_order, seo_title, seo_description)
values
  ('happy-halloween', 'Happy Halloween Tumbler', 'Orange Halloween artwork with bats, a glowing moon, jack-o-lanterns and a spooky cemetery scene. Optional name or short-text personalization included.', 19.99, 'Drinkware', 'Tumblers', 'Stainless steel', '["Orange"]'::jsonb, '["/images/tumblers/happy-halloween.png"]'::jsonb, 'active', 50, 5, false, false, true, 60, 'Happy Halloween Tumbler', 'Shop a personalized Happy Halloween tumbler from Lucent Print.'),
  ('inspirada-halloween', 'Inspirada Bulldogs Halloween Tumbler', 'Halloween bulldog and pumpkin artwork with bold green Inspirada Bulldogs lettering. Optional name or short-text personalization included.', 19.99, 'Drinkware', 'Tumblers', 'Stainless steel', '["Orange", "Green"]'::jsonb, '["/images/tumblers/inspirada-halloween.png"]'::jsonb, 'active', 50, 5, false, false, true, 61, 'Inspirada Bulldogs Halloween Tumbler', 'Shop a personalized Inspirada Bulldogs Halloween tumbler from Lucent Print.'),
  ('autumn-pumpkin', 'Autumn Pumpkin Tumbler', 'Warm orange pumpkins, autumn leaves and curling vines wrap around this seasonal design. Optional name or short-text personalization included.', 19.99, 'Drinkware', 'Tumblers', 'Stainless steel', '["Orange"]'::jsonb, '["/images/tumblers/autumn-pumpkin.png"]'::jsonb, 'active', 50, 5, false, false, true, 62, 'Autumn Pumpkin Tumbler', 'Shop a personalized autumn pumpkin tumbler from Lucent Print.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  collection_name = excluded.collection_name,
  material = excluded.material,
  colors = excluded.colors,
  images = excluded.images,
  status = excluded.status,
  inventory_quantity = excluded.inventory_quantity,
  low_stock_threshold = excluded.low_stock_threshold,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();
