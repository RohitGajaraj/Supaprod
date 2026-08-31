-- THE RETURN EDGE FIRES EXACTLY ONCE PER MISS — gap #4, second of two.
--
-- Applied SEPARATELY from the column that precedes it, and the schema verified
-- between the two, because Lovable concatenates migrations handed to it as a
-- batch and drops statements out of the middle. Founder's standing instruction.
--
-- PARTIAL, on purpose. Almost every track has `from_learning_id` NULL -- work
-- that entered any other way -- and a plain UNIQUE would allow exactly one such
-- track in the whole table. The `WHERE ... IS NOT NULL` clause is what makes
-- this a constraint on the return edge rather than on the product.
CREATE UNIQUE INDEX IF NOT EXISTS spine_tracks_one_return_per_learning
  ON public.spine_tracks (from_learning_id)
  WHERE from_learning_id IS NOT NULL;
