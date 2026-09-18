CREATE POLICY "Users can delete their own highlights"
ON public.highlights
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);