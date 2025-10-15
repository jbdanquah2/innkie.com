PROJECT_ID="linkifyurl"
DEPLOYER_SA="github-action-1063660050@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="firebase-adminsdk-fbsvc@${PROJECT_ID}.iam.gserviceaccount.com"

# allow deployer to impersonate the runtime SA
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:$DEPLOYER_SA" \
  --role="roles/iam.serviceAccountUser"

# allow deploys to Cloud Run
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SA" \
  --role="roles/run.admin"

# allow pushing/reading images (GCR/AR)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SA" \
  --role="roles/storage.admin"
