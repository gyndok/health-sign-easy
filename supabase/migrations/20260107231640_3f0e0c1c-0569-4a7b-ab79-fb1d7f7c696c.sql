-- Create storage bucket for consent PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-pdfs', 'consent-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow providers to read their own consent PDFs
CREATE POLICY "Providers can read own consent PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'consent-pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to upload PDFs (via edge function)
CREATE POLICY "Service role can insert consent PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'consent-pdfs');