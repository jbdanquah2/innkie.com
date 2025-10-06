PROJECT_ID=linkifyurl
SA=cloud-run-deployer@${PROJECT_ID}.iam.gserviceaccount.com

# 1️⃣ Cloud Build
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/cloudbuild.builds.editor"

# 2️⃣ Storage access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/storage.objectAdmin"

# 3️⃣ Cloud Run deploy permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/run.admin"

# 4️⃣ Allow to impersonate runtime service account (like firebase-adminsdk-fbsvc@…)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/iam.serviceAccountUser"

# 5️⃣ Enable API usage
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/serviceusage.serviceUsageConsumer"
