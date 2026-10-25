-- Elimină EXCLUSIV implementarea veche „Materiale pe categorii”.
-- Include cele 12 rânduri [TEST] și orice alte rânduri din catalog_materials.
-- NU afectează autori, opere, limba_*, quiz-uri, reviste sau noile tabele edu_*.
-- Nu folosește CASCADE și nu șterge direct obiecte din storage.objects.
begin;
do $$
begin
    if exists (select 1 from storage.objects where bucket_id = 'CatalogMateriale') then
        raise exception 'Bucketul CatalogMateriale conține fișiere. Șterge fișierele DOAR din acest bucket prin Supabase Storage, apoi rulează din nou scriptul. Nicio modificare nu a fost aplicată.';
    end if;
end;
$$;
drop policy if exists catalog_files_read on storage.objects;
drop policy if exists catalog_files_admin on storage.objects;
drop table if exists public.catalog_materials;
drop function if exists public.catalog_materials_touch();
drop function if exists public.catalog_is_admin();
delete from storage.buckets where id = 'CatalogMateriale';
commit;
