#!/bin/zsh
# Bascule « une ligne par fiche » du Sales Coach (migration 013).
# À lancer depuis le dossier isseo-app, de préférence hors heures d'appel :
#   ./supabase/bascule-fiches.sh
# Étapes : 1) déploie les 8 fonctions (elles lisent les deux formats, rien ne change tant que la
# base n'est pas basculée)  2) bascule la base en une seule transaction, avec sauvegarde complète
# 3) contrôle. Retour arrière : voir la fin de supabase/migrations/013_coach_prospects_split.sql.
set -e
REF=wfqtpcujujqxgfsgbpvp
cd "$(dirname "$0")/.."

echo "── 1/3 · Déploiement des fonctions ──"
for f in coach-sync allo-webhook allo-backfill aircall-webhook aircall-sync boost-push boost-sync weekly-digest; do
  echo "→ $f"
  supabase functions deploy "$f" --no-verify-jwt --project-ref "$REF" >/dev/null
done
echo "Fonctions déployées."

echo
echo "── Avant bascule ──"
supabase db query --linked -o table "select jsonb_array_length(data->'prospects') as fiches_ligne_unique, (data->>'split') as deja_bascule from coach_store where id = '_coach_prospects'"

echo
printf "Lancer la bascule de la base maintenant ? (oui/non) "
read REP
if [ "$REP" != "oui" ]; then echo "Bascule non lancée. Les fonctions déployées fonctionnent comme avant."; exit 0; fi

echo "── 2/3 · Bascule de la base ──"
supabase db query --linked -f supabase/migrations/013_coach_prospects_split.sql >/dev/null
echo "Script 013 exécuté."

echo
echo "── 3/3 · Contrôle ──"
supabase db query --linked -o table "select (select count(*) from coach_prospects) as fiches_une_par_ligne, (select jsonb_array_length(data->'prospects') from coach_store where id = '_coach_prospects_avant_split') as fiches_sauvegarde, (select data from coach_store where id = '_coach_prospects') as reglages"
echo
echo "Attendu : les deux nombres de fiches sont égaux, et reglages contient \"split\": true."
