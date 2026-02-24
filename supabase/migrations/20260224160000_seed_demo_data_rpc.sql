-- seed_demo_data(): Populates the authenticated user's account with realistic demo consent data.
-- clear_demo_data(): Removes all demo data (tagged with 'demo-data') for the authenticated user.
-- Both functions use SECURITY DEFINER to bypass RLS for cross-role inserts (e.g., withdrawals).

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
  -- Invite IDs (completed ones that need submissions)
  v_inv_c1 uuid; v_inv_c2 uuid; v_inv_c3 uuid; v_inv_c4 uuid; v_inv_c5 uuid;
  -- Invite IDs (viewed ones)
  v_inv_v1 uuid; v_inv_v2 uuid;
  -- Submission IDs (for withdrawals)
  v_sub_1 uuid; v_sub_2 uuid; v_sub_3 uuid; v_sub_4 uuid; v_sub_5 uuid;
  v_sub_6 uuid; v_sub_7 uuid;
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
  -- 1. INSERT CONSENT MODULES
  -- ============================================================

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Knee Arthroscopy Consent',
    E'INFORMED CONSENT FOR KNEE ARTHROSCOPY\n\nProcedure Overview:\nKnee arthroscopy is a minimally invasive surgical procedure used to diagnose and treat problems within the knee joint. A small camera (arthroscope) is inserted through a small incision to visualize, diagnose, and treat knee conditions.\n\nIndications:\nThis procedure may be recommended for meniscal tears, cartilage damage, ligament reconstruction, removal of loose bodies, or treatment of synovial conditions.\n\nRisks and Complications:\nAs with any surgical procedure, knee arthroscopy carries certain risks including but not limited to:\n- Infection at incision sites\n- Blood clots (deep vein thrombosis)\n- Nerve or blood vessel damage\n- Stiffness or loss of range of motion\n- Allergic reaction to anesthesia\n- Need for additional surgery\n\nBenefits:\n- Smaller incisions compared to open surgery\n- Faster recovery time\n- Less pain and scarring\n- Can be performed as outpatient procedure\n\nAlternatives:\nAlternative treatments may include physical therapy, anti-inflammatory medications, corticosteroid injections, or open surgical procedures.\n\nRecovery:\nMost patients can return to light activities within 1-2 weeks. Full recovery typically takes 4-6 weeks depending on the procedure performed.',
    'https://www.youtube.com/watch?v=K1MuUgyrFuA',
    ARRAY['orthopedics', 'surgery', 'demo-data']
  ) RETURNING id INTO v_mod_knee;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'LASIK Eye Surgery Consent',
    E'INFORMED CONSENT FOR LASIK (Laser-Assisted In Situ Keratomileusis)\n\nProcedure Overview:\nLASIK is a refractive eye surgery that uses an excimer laser to reshape the cornea to correct nearsightedness (myopia), farsightedness (hyperopia), and astigmatism. The goal is to reduce or eliminate the need for glasses or contact lenses.\n\nHow It Works:\n1. A thin corneal flap is created using a microkeratome or femtosecond laser\n2. The flap is lifted to expose the underlying corneal tissue\n3. An excimer laser reshapes the cornea based on pre-operative measurements\n4. The flap is repositioned and heals naturally\n\nRisks and Complications:\n- Dry eyes (temporary or persistent)\n- Glare, halos, or double vision, especially at night\n- Undercorrection or overcorrection requiring enhancement\n- Flap complications (wrinkles, displacement)\n- Infection or inflammation\n- Corneal ectasia (progressive thinning)\n- Rarely, loss of best-corrected vision\n\nExpected Outcomes:\nApproximately 96% of patients achieve 20/20 vision or better after LASIK. Results may vary based on individual factors including prescription strength and corneal characteristics.\n\nAlternatives:\n- PRK (Photorefractive Keratectomy)\n- SMILE (Small Incision Lenticule Extraction)\n- Implantable contact lenses\n- Continued use of glasses or contact lenses\n\nPost-Operative Care:\nPatients should avoid rubbing eyes for several weeks, use prescribed eye drops, and attend all follow-up appointments. Most patients notice improved vision within 24 hours.',
    NULL,
    ARRAY['ophthalmology', 'surgery', 'demo-data']
  ) RETURNING id INTO v_mod_lasik;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Dermal Filler Treatment Consent',
    E'INFORMED CONSENT FOR DERMAL FILLER INJECTION\n\nProcedure Overview:\nDermal fillers are injectable substances used to restore volume, smooth lines and wrinkles, and enhance facial contours. Common treatment areas include nasolabial folds, lips, cheeks, chin, and under-eye hollows.\n\nProduct Information:\nHyaluronic acid-based fillers (such as Juvederm or Restylane) are the most commonly used dermal fillers. Hyaluronic acid is a naturally occurring substance in the body that helps maintain skin hydration and volume.\n\nRisks and Complications:\n- Bruising, swelling, and redness at injection sites\n- Asymmetry or irregular contours\n- Lumps or nodules under the skin\n- Allergic reaction\n- Infection\n- Vascular occlusion (rare but serious - can lead to tissue damage or vision changes)\n- Migration of filler material\n- Granuloma formation\n\nDuration of Results:\nResults typically last 6-18 months depending on the product used, treatment area, and individual metabolism. Touch-up treatments may be recommended.\n\nAlternatives:\n- Botulinum toxin (Botox) for dynamic wrinkles\n- Chemical peels or laser resurfacing\n- Surgical facelift procedures\n- Topical skincare treatments\n\nPre-Treatment Instructions:\nAvoid blood-thinning medications and supplements (aspirin, ibuprofen, fish oil, vitamin E) for 7 days prior to treatment. Inform your provider of any history of cold sores.',
    NULL,
    ARRAY['dermatology', 'cosmetic', 'demo-data']
  ) RETURNING id INTO v_mod_filler;

  INSERT INTO consent_modules (id, created_by, name, description, video_url, tags)
  VALUES (
    gen_random_uuid(), v_user_id,
    'Colonoscopy Procedure Consent',
    E'INFORMED CONSENT FOR COLONOSCOPY\n\nProcedure Overview:\nA colonoscopy is a procedure that allows your physician to examine the lining of the large intestine (colon) using a flexible tube with a camera (colonoscope). It is used for screening, diagnosis, and treatment of various colon conditions.\n\nIndications:\n- Colorectal cancer screening (recommended starting at age 45)\n- Evaluation of gastrointestinal symptoms (bleeding, changes in bowel habits, abdominal pain)\n- Surveillance for patients with history of polyps or colorectal cancer\n- Inflammatory bowel disease monitoring\n\nWhat to Expect:\n1. You will receive sedation to ensure comfort during the procedure\n2. The colonoscope is inserted through the rectum and advanced through the colon\n3. Air or carbon dioxide is used to inflate the colon for better visualization\n4. Polyps may be removed during the procedure (polypectomy)\n5. Tissue biopsies may be taken for laboratory analysis\n\nRisks and Complications:\n- Bleeding, particularly after polyp removal\n- Perforation (tear) of the colon wall (rare, approximately 1 in 1,000)\n- Adverse reaction to sedation\n- Missed lesions\n- Post-polypectomy syndrome (abdominal pain, fever)\n- Infection (extremely rare)\n\nBowel Preparation:\nA clean colon is essential for a thorough examination. You will receive detailed instructions for bowel preparation, which typically involves a clear liquid diet and a prescribed laxative solution the day before the procedure.\n\nAfter the Procedure:\nYou will need a responsible adult to drive you home. You may experience mild bloating or cramping. Results of biopsies typically take 5-7 business days.',
    'https://www.youtube.com/watch?v=jRIisuH0EJU',
    ARRAY['gastroenterology', 'screening', 'demo-data']
  ) RETURNING id INTO v_mod_colonoscopy;

  -- ============================================================
  -- 2. INSERT INVITES (12 total)
  -- ============================================================

  -- 3 PENDING invites (recent, expires in 7 days)
  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES
    (v_user_id, v_mod_knee, 'maria.garcia.demo@example.com', 'Maria', 'Garcia', 'pending',
     now() + interval '7 days', gen_random_uuid()),
    (v_user_id, v_mod_lasik, 'james.chen.demo@example.com', 'James', 'Chen', 'pending',
     now() + interval '6 days', gen_random_uuid()),
    (v_user_id, v_mod_colonoscopy, 'priya.patel.demo@example.com', 'Priya', 'Patel', 'pending',
     now() + interval '5 days', gen_random_uuid());

  -- 2 VIEWED invites (viewed 1-2 days ago)
  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, expires_at, token)
  VALUES
    (gen_random_uuid(), v_user_id, v_mod_filler, 'robert.wilson.demo@example.com', 'Robert', 'Wilson', 'viewed',
     now() - interval '1 day', now() + interval '6 days', gen_random_uuid()),
    (gen_random_uuid(), v_user_id, v_mod_knee, 'aisha.thompson.demo@example.com', 'Aisha', 'Thompson', 'viewed',
     now() - interval '2 days', now() + interval '5 days', gen_random_uuid())
  RETURNING id INTO v_inv_v1;
  -- Note: v_inv_v1 gets last returned id (Aisha). We need both for submissions.

  -- Re-fetch the two viewed invite IDs
  SELECT id INTO v_inv_v1 FROM invites WHERE created_by = v_user_id AND patient_email = 'robert.wilson.demo@example.com' LIMIT 1;
  SELECT id INTO v_inv_v2 FROM invites WHERE created_by = v_user_id AND patient_email = 'aisha.thompson.demo@example.com' LIMIT 1;

  -- 5 COMPLETED invites (over past 30 days)
  INSERT INTO invites (id, created_by, module_id, patient_email, patient_first_name, patient_last_name, status, viewed_at, completed_at, expires_at, token)
  VALUES
    (gen_random_uuid(), v_user_id, v_mod_knee, 'sarah.johnson.demo@example.com', 'Sarah', 'Johnson', 'completed',
     now() - interval '28 days', now() - interval '27 days', now() + interval '30 days', gen_random_uuid()),
    (gen_random_uuid(), v_user_id, v_mod_lasik, 'david.kim.demo@example.com', 'David', 'Kim', 'completed',
     now() - interval '21 days', now() - interval '20 days', now() + interval '30 days', gen_random_uuid()),
    (gen_random_uuid(), v_user_id, v_mod_filler, 'emily.rodriguez.demo@example.com', 'Emily', 'Rodriguez', 'completed',
     now() - interval '14 days', now() - interval '13 days', now() + interval '30 days', gen_random_uuid()),
    (gen_random_uuid(), v_user_id, v_mod_colonoscopy, 'michael.chang.demo@example.com', 'Michael', 'Chang', 'completed',
     now() - interval '7 days', now() - interval '6 days', now() + interval '30 days', gen_random_uuid()),
    (gen_random_uuid(), v_user_id, v_mod_knee, 'lisa.nakamura.demo@example.com', 'Lisa', 'Nakamura', 'completed',
     now() - interval '3 days', now() - interval '2 days', now() + interval '30 days', gen_random_uuid());

  -- Fetch completed invite IDs
  SELECT id INTO v_inv_c1 FROM invites WHERE created_by = v_user_id AND patient_email = 'sarah.johnson.demo@example.com' LIMIT 1;
  SELECT id INTO v_inv_c2 FROM invites WHERE created_by = v_user_id AND patient_email = 'david.kim.demo@example.com' LIMIT 1;
  SELECT id INTO v_inv_c3 FROM invites WHERE created_by = v_user_id AND patient_email = 'emily.rodriguez.demo@example.com' LIMIT 1;
  SELECT id INTO v_inv_c4 FROM invites WHERE created_by = v_user_id AND patient_email = 'michael.chang.demo@example.com' LIMIT 1;
  SELECT id INTO v_inv_c5 FROM invites WHERE created_by = v_user_id AND patient_email = 'lisa.nakamura.demo@example.com' LIMIT 1;

  -- 2 EXPIRED invites
  INSERT INTO invites (created_by, module_id, patient_email, patient_first_name, patient_last_name, status, expires_at, token)
  VALUES
    (v_user_id, v_mod_lasik, 'thomas.anderson.demo@example.com', 'Thomas', 'Anderson', 'pending',
     now() - interval '3 days', gen_random_uuid()),
    (v_user_id, v_mod_filler, 'jennifer.lee.demo@example.com', 'Jennifer', 'Lee', 'pending',
     now() - interval '1 day', gen_random_uuid());

  -- ============================================================
  -- 3. INSERT CONSENT SUBMISSIONS (7 total)
  -- ============================================================

  -- 5 from completed invites
  INSERT INTO consent_submissions (id, invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES
    (gen_random_uuid(), v_inv_c1, v_mod_knee, v_user_id, 'Sarah', 'Johnson', 'sarah.johnson.demo@example.com',
     'Sarah Johnson', now() - interval '27 days'),
    (gen_random_uuid(), v_inv_c2, v_mod_lasik, v_user_id, 'David', 'Kim', 'david.kim.demo@example.com',
     'David Kim', now() - interval '20 days'),
    (gen_random_uuid(), v_inv_c3, v_mod_filler, v_user_id, 'Emily', 'Rodriguez', 'emily.rodriguez.demo@example.com',
     'Emily Rodriguez', now() - interval '13 days'),
    (gen_random_uuid(), v_inv_c4, v_mod_colonoscopy, v_user_id, 'Michael', 'Chang', 'michael.chang.demo@example.com',
     'Michael Chang', now() - interval '6 days'),
    (gen_random_uuid(), v_inv_c5, v_mod_knee, v_user_id, 'Lisa', 'Nakamura', 'lisa.nakamura.demo@example.com',
     'Lisa Nakamura', now() - interval '2 days');

  -- 2 from viewed invites (patients who viewed AND submitted)
  INSERT INTO consent_submissions (id, invite_id, module_id, provider_id, patient_first_name, patient_last_name, patient_email, signature, signed_at)
  VALUES
    (gen_random_uuid(), v_inv_v1, v_mod_filler, v_user_id, 'Robert', 'Wilson', 'robert.wilson.demo@example.com',
     'Robert Wilson', now() - interval '1 day'),
    (gen_random_uuid(), v_inv_v2, v_mod_knee, v_user_id, 'Aisha', 'Thompson', 'aisha.thompson.demo@example.com',
     'Aisha Thompson', now() - interval '1 day');

  -- Fetch submission IDs for withdrawals
  SELECT id INTO v_sub_1 FROM consent_submissions WHERE invite_id = v_inv_c1 LIMIT 1;
  SELECT id INTO v_sub_3 FROM consent_submissions WHERE invite_id = v_inv_c3 LIMIT 1;

  -- ============================================================
  -- 4. INSERT CONSENT WITHDRAWALS (2 total)
  -- ============================================================

  INSERT INTO consent_withdrawals (submission_id, patient_user_id, reason, withdrawn_at)
  VALUES
    (v_sub_1, v_fake_patient_id, 'I would like to seek a second opinion before proceeding with the surgery.', now() - interval '25 days'),
    (v_sub_3, v_fake_patient_id, 'I have decided to explore non-surgical alternatives first.', now() - interval '10 days');

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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;


-- ============================================================
-- clear_demo_data(): Removes demo data for the current user
-- ============================================================

CREATE OR REPLACE FUNCTION public.clear_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Delete modules tagged 'demo-data'. Cascade handles:
  -- modules → invites (ON DELETE CASCADE via module_id)
  -- invites → submissions (ON DELETE CASCADE via invite_id)
  -- submissions → withdrawals (ON DELETE CASCADE via submission_id)
  DELETE FROM consent_modules
  WHERE created_by = v_user_id AND tags @> ARRAY['demo-data'];

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'cleared',
    'modules_deleted', v_deleted_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;
