-- Opțional: șterge exclusiv cele 18 materiale de test din acest set, prin ID.
-- Nu afectează alte materiale, tabele sau fișiere.
begin;

delete from public.edu_fise_vizuale where id in ('69417828-83d7-5625-8ecc-e6fd30b49d1e', '2b0a286f-69f6-5cf0-a319-dde75550dbfe');

delete from public.edu_antrenament_examen where id in ('cdf0ef0a-94fa-581a-9b3f-cabff2bfff26', 'c7c745d0-e59d-500c-9e21-851e34e1c678');

delete from public.edu_exercitii_competente where id in ('6a6c6165-852f-5b73-a3ed-8a36ca05a856', 'e46e2863-4821-5efd-a0e3-a48e0c4b8de7');

delete from public.edu_teste_bareme where id in ('9c67cf3f-5c6d-50d8-8909-46234e4916f0', '60808aef-e98c-5ee6-81e7-2e14a8e79168');

delete from public.edu_resurse_ces where id in ('3e4d51b8-9e76-5add-be2e-7dd3e2646228', '4bedf0bd-2faa-5a56-887c-6e61a64af51e');

delete from public.edu_centralizatoare_swot where id in ('32feea34-32c2-5601-a429-dedf927f0329', '03a35b87-5270-5488-a0c5-8572942a5cba');

delete from public.edu_planuri_interventie where id in ('66a48b7a-c177-55d6-b1f4-f9c83da01d88', '566c2ade-a53d-5040-aa65-8a99a9b759e5');

delete from public.edu_activitati_remediale where id in ('684ac61d-9f7a-544e-9918-946271640b12', 'bf50ddbe-8ec2-5fbc-850d-cce5b34b9b4f');

delete from public.edu_documente_planificare where id in ('d4e68d3f-42a4-5391-934d-f5ec37cec27a', 'b7f88f88-8959-563f-9bd7-aedd668ffe90');

commit;
