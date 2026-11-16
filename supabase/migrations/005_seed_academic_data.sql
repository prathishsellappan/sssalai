-- ====================================================================
-- Migration: 005_seed_academic_data.sql
-- Description: Seed initial classes, subjects, mappings, and site settings
-- ====================================================================

-- 1. Insert Initial Site Settings (id = 1)
INSERT INTO public.site_settings (id, student_access_enabled, announcement)
VALUES (
    1,
    TRUE,
    'Welcome to the School Study Material Management Portal. Access study notes, presentations, and online assignments directly from your class dashboard.'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Standard Academic Classes (Class 6 through Class 12)
INSERT INTO public.classes (id, name, display_order, is_active)
VALUES
    ('c6000000-0000-0000-0000-000000000006', 'Class 6', 1, TRUE),
    ('c7000000-0000-0000-0000-000000000007', 'Class 7', 2, TRUE),
    ('c8000000-0000-0000-0000-000000000008', 'Class 8', 3, TRUE),
    ('c9000000-0000-0000-0000-000000000009', 'Class 9', 4, TRUE),
    ('ca000000-0000-0000-0000-000000000010', 'Class 10', 5, TRUE),
    ('cb000000-0000-0000-0000-000000000011', 'Class 11', 6, TRUE),
    ('cc000000-0000-0000-0000-000000000012', 'Class 12', 7, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Common Academic Subjects
INSERT INTO public.subjects (id, name, is_active)
VALUES
    ('s1000000-0000-0000-0000-000000000001', 'Mathematics', TRUE),
    ('s2000000-0000-0000-0000-000000000002', 'Physics', TRUE),
    ('s3000000-0000-0000-0000-000000000003', 'Chemistry', TRUE),
    ('s4000000-0000-0000-0000-000000000004', 'Biology', TRUE),
    ('s5000000-0000-0000-0000-000000000005', 'English', TRUE),
    ('s6000000-0000-0000-0000-000000000006', 'Computer Science', TRUE),
    ('s7000000-0000-0000-0000-000000000007', 'Social Studies', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 4. Map Subjects to Classes
-- Classes 6 to 10 have Math, English, Social Studies, Computer Science, and General Science (mapped via Physics/Chemistry/Biology)
-- Classes 11 and 12 have Math, Physics, Chemistry, Biology, English, Computer Science

DO $$
DECLARE
    v_class RECORD;
    v_subj RECORD;
BEGIN
    -- Map English, Mathematics, Computer Science to all classes
    FOR v_class IN SELECT id FROM public.classes LOOP
        FOR v_subj IN SELECT id FROM public.subjects WHERE name IN ('Mathematics', 'English', 'Computer Science') LOOP
            INSERT INTO public.class_subjects (class_id, subject_id)
            VALUES (v_class.id, v_subj.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- Map Social Studies to classes 6, 7, 8, 9, 10
    FOR v_class IN SELECT id FROM public.classes WHERE name IN ('Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10') LOOP
        FOR v_subj IN SELECT id FROM public.subjects WHERE name = 'Social Studies' LOOP
            INSERT INTO public.class_subjects (class_id, subject_id)
            VALUES (v_class.id, v_subj.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- Map Physics, Chemistry, Biology to Class 9, 10, 11, 12
    FOR v_class IN SELECT id FROM public.classes WHERE name IN ('Class 9', 'Class 10', 'Class 11', 'Class 12') LOOP
        FOR v_subj IN SELECT id FROM public.subjects WHERE name IN ('Physics', 'Chemistry', 'Biology') LOOP
            INSERT INTO public.class_subjects (class_id, subject_id)
            VALUES (v_class.id, v_subj.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
