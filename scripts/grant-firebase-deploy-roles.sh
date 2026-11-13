#!/usr/bin/env bash
# Lets the GitHub "Deploy Firebase" workflow deploy Firestore rules and indexes.
# Grants the deploy service account two narrow roles on the linkifyurl project:
#   roles/firebaserules.admin   (publish Firestore security rules)
#   roles/datastore.indexAdmin  (publish Firestore indexes)
#
# Usage:
#   scripts/grant-firebase-deploy-roles.sh                      # lists the project's service accounts, changes nothing
#   scripts/grant-firebase-deploy-roles.sh <service-account-email>
#
# The account to pass is the "client_email" inside the CLOUD_RUN GitHub secret (the one the Cloud Run deploy uses).
# Run it while gcloud is logged in as someone who can edit IAM on linkifyurl (gcloud auth login).
set -euo pipefail

PROJECT="${PROJECT:-linkifyurl}"
SA="${1:-}"

echo "gcloud account : $(gcloud config get-value account 2>/dev/null)"
echo "project        : $PROJECT"
echo

if [[ -z "$SA" ]]; then
  echo "Service accounts in $PROJECT:"
  gcloud iam service-accounts list --project "$PROJECT" --format="table(email,displayName,disabled)"
  echo
  echo "Re-run with the right email:  $0 <service-account-email>"
  exit 0
fi

echo "Roles $SA has now:"
gcloud projects get-iam-policy "$PROJECT" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SA" \
  --format="value(bindings.role)" | sort | sed 's/^/  /'
echo
read -r -p "Grant firebaserules.admin and datastore.indexAdmin to $SA on $PROJECT? [y/N] " yn
[[ "$yn" == "y" || "$yn" == "Y" ]] || { echo "Nothing changed."; exit 0; }

for ROLE in roles/firebaserules.admin roles/datastore.indexAdmin; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$SA" --role="$ROLE" --condition=None --quiet >/dev/null
  echo "granted $ROLE"
done
echo "Done. IAM changes can take a minute to apply."
