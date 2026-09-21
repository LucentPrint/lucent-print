update public.products
set
  description = rtrim(description) || ' A satisfying sensory fidget toy designed to keep hands busy and support focus for people with ADHD and other sensory needs.',
  seo_description = rtrim(coalesce(seo_description, description)) || ' Sensory fidget clicker for ADHD, focus, and busy hands.',
  updated_at = now()
where is_active = true
  and collection_name = '3D Clickers'
  and description not ilike '%sensory fidget toy%';
