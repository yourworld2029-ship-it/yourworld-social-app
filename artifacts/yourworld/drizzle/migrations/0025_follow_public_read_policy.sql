-- Follow rows are public relationship metadata; writes remain owner-only.

drop policy if exists follows_read_authenticated on public.follows;
drop policy if exists follows_read_public on public.follows;

create policy follows_read_public on public.follows
  for select to anon, authenticated using (true);

grant select on public.follows to anon, authenticated;