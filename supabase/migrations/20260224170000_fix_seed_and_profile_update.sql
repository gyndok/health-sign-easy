-- Fix 1: Create a SECURITY DEFINER function for profile updates
-- The user_profiles table has a recursive RLS policy that blocks direct updates.
-- This function bypasses RLS safely by running as the function owner.

CREATE OR REPLACE FUNCTION public.update_provider_profile(
  p_full_name text,
  p_practice_name text DEFAULT NULL,
  p_primary_specialty text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_timezone text DEFAULT 'America/Chicago'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE user_profiles
  SET
    full_name = p_full_name,
    practice_name = p_practice_name,
    primary_specialty = p_primary_specialty,
    phone = p_phone,
    timezone = p_timezone,
    updated_at = now()
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN jsonb_build_object('status', 'updated');
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_provider_profile(text, text, text, text, text) TO authenticated;


-- Fix 2: Recreate seed_demo_data() with individual inserts to avoid multi-row RETURNING issues
-- and with explicit enum casts for maximum compatibility.

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_fake_patient_id uuid;
  -- Module IDs
  v_mod_knee uuid;
  v_mod_lasik uuid;
  v_mod_filler uuid;
  v_mod_colonoscopy uuid;
  -- Invite IDs
  v_inv_c1 uuid; v_inv_c2 uuid; v_inv_c3 uuid; v_inv_c4 uuid; v_inv_c5 uuid;
  v_inv_v1 uuid; v_inv_v2 uuid;
  -- Submission IDs
  v_sub_1 uuid; v_sub_3 uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Idempotency check: skip if demo data already exists
  IF EXISTS (
    SELECT 1 FROM consent_modules
    WHERE created_by = v_user_id AND tags @> ARRAY['demo-data']
  ) THEN
    RETURN jsonb_build_object('status', 'already_seeded');
  END IF;

  v_fake_patient_id := gen_random_uuid();

  -- ============================================================
  -- 1. INSERT CONSENT MODULES (4 total)
  -- ============================================================

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Knee Arthroscopy Consent',
    E'INFORMED CONSENT FOR KNEE ARTHROSCOPY\n\nProcedure Overview:\nKnee arthroscopy is a minimally invasive surgical procedure used to diagnose and treat problems within the knee joint. A small camera (arthroscope) is inserted through a small incision to visualize, diagnose, and treat knee conditions.\n\nIndications:\nThis procedure may be recommended for meniscal tears, cartilage damage, ligament reconstruction, removal of loose bodies, or treatment of synovial conditions.\n\nRisks and Complications:\n- Infection at incision sites\n- Blood clots (deep vein thrombosis)\n- Nerve or blood vessel damage\n- Stiffness or loss of range of motion\n- Allergic reaction to anesthesia\n- Need for additional surgery\n\nBenefits:\n- Smaller incisions compared to open surgery\n- Faster recovery time\n- Less pain and scarring\n- Can be performed as outpatient procedure\n\nAlternatives:\nAlternative treatments may include physical therapy, anti-inflammatory medications, corticosteroid injections, or open surgical procedures.\n\nRecovery:\nMost patients can return to light activities within 1-2 weeks. Full recovery typically takes 4-6 weeks depending on the procedure performed.',
    'https://www.youtube.com/watch?v=K1MuUgyrFuA',
    ARRAY['orthopedics', 'surgery', 'demo-data']
  ) RETURNING id INTO v_mod_knee;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'LASIK Eye Surgery Consent',
    E'INFORMED CONSENT FOR LASIK (Laser-Assisted In Situ Keratomileusis)\n\nProcedure Overview:\nLASIK is a refractive eye surgery that uses an excimer laser to reshape the cornea to correct nearsightedness, farsightedness, and astigmatism.\n\nHow It Works:\n1. A thin corneal flap is created using a microkeratome or femtosecond laser\n2. The flap is lifted to expose the underlying corneal tissue\n3. An excimer laser reshapes the cornea based on pre-operative measurements\n4. The flap is repositioned and heals naturally\n\nRisks and Complications:\n- Dry eyes (temporary or persistent)\n- Glare, halos, or double vision\n- Undercorrection or overcorrection\n- Flap complications\n- Infection or inflammation\n- Corneal ectasia\n\nExpected Outcomes:\nApproximately 96% of patients achieve 20/20 vision or better after LASIK.\n\nAlternatives:\n- PRK (Photorefractive Keratectomy)\n- SMILE (Small Incision Lenticule Extraction)\n- Implantable contact lenses\n- Continued use of glasses or contact lenses',
    NULL,
    ARRAY['ophthalmology', 'surgery', 'demo-data']
  ) RETURNING id INTO v_mod_lasik;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Dermal Filler Treatment Consent',
    E'INFORMED CONSENT FOR DERMAL FILLER INJECTION\n\nProcedure Overview:\nDermal fillers are injectable substances used to restore volume, smooth lines and wrinkles, and enhance facial contours.\n\nProduct Information:\nHyaluronic acid-based fillers are the most commonly used dermal fillers. Hyaluronic acid is a naturally occurring substance in the body.\n\nRisks and Complications:\n- Bruising, swelling, and redness\n- Asymmetry or irregular contours\n- Lumps or nodules\n- Allergic reaction\n- Infection\n- Vascular occlusion (rare but serious)\n\nDuration of Results:\nResults typically last 6-18 months depending on the product used and treatment area.\n\nAlternatives:\n- Botulinum toxin for dynamic wrinkles\n- Chemical peels or laser resurfacing\n- Surgical facelift procedures',
    NULL,
    ARRAY['dermatology', 'cosmetic', 'demo-data']
  ) RETURNING id INTO v_mod_filler;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Colonoscopy Procedure Consent',
    E'INFORMED CONSENT FOR COLONOSCOPY\n\nProcedure Overview:\nA colonoscopy allows your physician to examine the lining of the large intestine using a flexible tube with a camera.\n\nIndications:\n- Colorectal cancer screening (recommended starting at age 45)\n- Evaluation of gastrointestinal symptoms\n- Surveillance for patients with history of polyps\n- Inflammatory bowel disease monitoring\n\nWhat to Expect:\n1. You will receive sedation to ensure comfort\n2. The colonoscope is inserted and advanced through the colon\n3. Polyps may be removed during the procedure\n4. Tissue biopsies may be taken\n\nRisks and Complications:\n- Bleeding, particularly after polyp removal\n- Perforation of the colon wall (rare)\n- Adverse reaction to sedation\n- Post-polypectomy syndrome\n\nBowel Preparation:\nYou will receive detailed instructions for bowel preparation the day before.\n\nAfter the Procedure:\nYou will need a responsible adult to drive you home.',
    'https://www.youtube.com/watch?v=jRIisuH0EJU',
    ARRAY['gastroenterology', 'screening', 'demo-data']
  ) RETURNING id INTO v_mod_colonoscopy;

  -- ============================================================
  -- 2. INSERT INVITES (12 total) — individual inserts to avoid issues
  -- ============================================================

  -- 3 PENDING invites
  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES (v_user_id, v_mod_knee, 'maria.garcia.demo@example.com', 'Maria', 'Garcia', 'pending'::invite_status,
    now() + interval '7 days', gen_random_uuid());

  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES (v_user_id, v_mod_lasik, 'james.chen.demo@example.com', 'James', 'Chen', 'pending'::invite_status,
    now() + interval '6 days', gen_random_uuid());

  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES (v_user_id, v_mod_colonoscopy, 'priya.patel.demo@example.com', 'Priya', 'Patel', 'pending'::invite_status,
    now() + interval '5 days', gen_random_uuid());

  -- 2 VIEWED invites
  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_filler, 'robert.wilson.demo@example.com', 'Robert', 'Wilson', 'viewed'::invite_status,
    now() - interval '1 day', now() + interval '6 days', gen_random_uuid())
  RETURNING id INTO v_inv_v1;

  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_knee, 'aisha.thompson.demo@example.com', 'Aisha', 'Thompson', 'viewed'::invite_status,
    now() - interval '2 days', now() + interval '5 days', gen_random_uuid())
  RETURNING id INTO v_inv_v2;

  -- 5 COMPLETED invites
  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_knee, 'sarah.johnson.demo@example.com', 'Sarah', 'Johnson', 'completed'::invite_status,
    now() - interval '28 days', now() - interval '27 days', now() + interval '30 days', gen_random_uuid())
  RETURNING id INTO v_inv_c1;

  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_lasik, 'david.kim.demo@example.com', 'David', 'Kim', 'completed'::invite_status,
    now() - interval '21 days', now() - interval '20 days', now() + interval '30 days', gen_random_uuid())
  RETURNING id INTO v_inv_c2;

  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_filler, 'emily.rodriguez.demo@example.com', 'Emily', 'Rodriguez', 'completed'::invite_status,
    now() - interval '14 days', now() - interval '13 days', now() + interval '30 days', gen_random_uuid())
  RETURNING id INTO v_inv_c3;

  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_colonoscopy, 'michael.chang.demo@example.com', 'Michael', 'Chang', 'completed'::invite_status,
    now() - interval '7 days', now() - interval '6 days', now() + interval '30 days', gen_random_uuid())
  RETURNING id INTO v_inv_c4;

  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES (gen_random_uuid(), v_user_id, v_mod_knee, 'lisa.nakamura.demo@example.com', 'Lisa', 'Nakamura', 'completed'::invite_status,
    now() - interval '3 days', now() - interval '2 days', now() + interval '30 days', gen_random_uuid())
  RETURNING id INTO v_inv_c5;

  -- 2 EXPIRED invites (pending but past expiry)
  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES (v_user_id, v_mod_lasik, 'thomas.anderson.demo@example.com', 'Thomas', 'Anderson', 'pending'::invite_status,
    now() - interval '3 days', gen_random_uuid());

  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES (v_user_id, v_mod_filler, 'jennifer.lee.demo@example.com', 'Jennifer', 'Lee', 'pending'::invite_status,
    now() - interval '1 day', gen_random_uuid());

  -- ============================================================
  -- 3. INSERT CONSENT SUBMISSIONS (7 total)
  -- ============================================================

  -- 5 from completed invites
  INSERT INTO consent_submissions (id, invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (gen_random_uuid(), v_inv_c1, v_mod_knee, v_user_id, 'Sarah', 'Johnson', 'sarah.johnson.demo@example.com',
    'Sarah Johnson', now() - interval '27 days')
  RETURNING id INTO v_sub_1;

  INSERT INTO consent_submissions (invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (v_inv_c2, v_mod_lasik, v_user_id, 'David', 'Kim', 'david.kim.demo@example.com',
    'David Kim', now() - interval '20 days');

  INSERT INTO consent_submissions (id, invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (gen_random_uuid(), v_inv_c3, v_mod_filler, v_user_id, 'Emily', 'Rodriguez', 'emily.rodriguez.demo@example.com',
    'Emily Rodriguez', now() - interval '13 days')
  RETURNING id INTO v_sub_3;

  INSERT INTO consent_submissions (invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (v_inv_c4, v_mod_colonoscopy, v_user_id, 'Michael', 'Chang', 'michael.chang.demo@example.com',
    'Michael Chang', now() - interval '6 days');

  INSERT INTO consent_submissions (invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (v_inv_c5, v_mod_knee, v_user_id, 'Lisa', 'Nakamura', 'lisa.nakamura.demo@example.com',
    'Lisa Nakamura', now() - interval '2 days');

  -- 2 from viewed invites
  INSERT INTO consent_submissions (invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (v_inv_v1, v_mod_filler, v_user_id, 'Robert', 'Wilson', 'robert.wilson.demo@example.com',
    'Robert Wilson', now() - interval '1 day');

  INSERT INTO consent_submissions (invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES (v_inv_v2, v_mod_knee, v_user_id, 'Aisha', 'Thompson', 'aisha.thompson.demo@example.com',
    'Aisha Thompson', now() - interval '1 day');

  -- ============================================================
  -- 4. INSERT CONSENT WITHDRAWALS (2 total)
  -- ============================================================

  INSERT INTO consent_withdrawals (submission_id, patient_user_id, reason, withdrawn_at)
  VALUES (v_sub_1, v_fake_patient_id, 'I would like to seek a second opinion before proceeding with the surgery.', now() - interval '25 days');

  INSERT INTO consent_withdrawals (submission_id, patient_user_id, reason, withdrawn_at)
  VALUES (v_sub_3, v_fake_patient_id, 'I have decided to explore non-surgical alternatives first.', now() - interval '10 days');

  -- ============================================================
  -- 5. RETURN SUMMARY
  -- ============================================================

  RETURN jsonb_build_object(
    'status', 'seeded',
    'modules', 4,
    'invites', 12,
    'submissions', 7,
    'withdrawals', 2
  );
END;
$$;

-- Re-grant (CREATE OR REPLACE preserves grants, but be explicit)
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;
