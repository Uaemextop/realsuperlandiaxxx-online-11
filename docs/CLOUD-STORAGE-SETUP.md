# ☁️ Cloud Storage Setup — Dropbox & Google Drive

This guide explains how to configure **Dropbox** and **Google Drive** as upload mirrors for the video processing pipeline. Processed `.mp4` files are uploaded directly to a folder in your cloud account using [rclone](https://rclone.org/).

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Dropbox Setup](#dropbox-setup)
4. [Google Drive Setup](#google-drive-setup)
5. [Adding Secrets to GitHub](#adding-secrets-to-github)
6. [Running the Workflow](#running-the-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The workflow supports three upload destinations (you can enable any combination):

| Destination | Workflow Input | Required Secret |
|------------|---------------|-----------------|
| **GitHub Releases** | `upload_github_release` (default: ✅) | `GITHUB_TOKEN` (automatic) |
| **Dropbox** | `upload_dropbox` | `RCLONE_DROPBOX_TOKEN` |
| **Google Drive** | `upload_gdrive` | `RCLONE_GDRIVE_TOKEN` |

Files are uploaded as individual `.mp4` files into a timestamped subfolder:
```
<cloud_folder>/<YYYYMMDD-HHMMSS>/
├── video1.mp4
├── video2.mp4
└── ...
```

---

## Prerequisites

- A local machine with [rclone installed](https://rclone.org/install/) (used once for token generation)
- A Dropbox account (for Dropbox uploads)
- A Google account (for Google Drive uploads)
- Admin access to the GitHub repository (to add secrets)

---

## Dropbox Setup

### Step 1 — Install rclone locally

```bash
# macOS
brew install rclone

# Linux
curl https://rclone.org/install.sh | sudo bash

# Windows — download from https://rclone.org/downloads/
```

### Step 2 — Authorize Dropbox

Run the interactive configuration on your local machine:

```bash
rclone authorize "dropbox"
```

This will:
1. Open your browser
2. Ask you to log in to Dropbox and grant access
3. Print a JSON token in the terminal

**Copy the entire JSON token** — it looks like this:

```json
{"access_token":"sl.xxxxx","token_type":"bearer","refresh_token":"xxxxx","expiry":"2026-01-01T00:00:00.000Z"}
```

### Step 3 — Save as GitHub Secret

Save this JSON token as the secret **`RCLONE_DROPBOX_TOKEN`** (see [Adding Secrets to GitHub](#adding-secrets-to-github)).

---

## Google Drive Setup

### Step 1 — Create a Google Cloud OAuth Client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for and enable **Google Drive API**
5. Navigate to **APIs & Services → Credentials**
6. Click **Create Credentials → OAuth client ID**
7. Select **Desktop app** as application type
8. Give it a name (e.g., `rclone-upload`)
9. Click **Create**
10. Note down the **Client ID** and **Client Secret**

> **Tip:** If your Google Workspace has restrictions, you may need to add the OAuth client to the "Internal" users list or set the app to "Testing" and add your email as a test user.

### Step 2 — Authorize Google Drive with rclone

Run the interactive configuration:

```bash
rclone config
```

Follow these prompts:

```
n) New remote
name> gdrive
Storage> drive
client_id> <YOUR_CLIENT_ID>       # from step 1 (or leave blank for rclone's default)
client_secret> <YOUR_CLIENT_SECRET> # from step 1 (or leave blank for rclone's default)
scope> 1                           # Full access (drive)
root_folder_id>                    # Leave blank
service_account_file>              # Leave blank
Edit advanced config? n
Use auto config? y
```

This will open your browser for Google OAuth authorization. After granting access, rclone saves the config.

### Step 3 — Extract the token

```bash
rclone config dump | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['gdrive']['token']))"
```

Or manually open `~/.config/rclone/rclone.conf` and copy the `token` value from the `[gdrive]` section.

The token looks like:

```json
{"access_token":"ya29.xxxxx","token_type":"Bearer","refresh_token":"1//xxxxx","expiry":"2026-01-01T00:00:00.000Z"}
```

### Step 4 — Save as GitHub Secret

Save this JSON token as the secret **`RCLONE_GDRIVE_TOKEN`** (see [Adding Secrets to GitHub](#adding-secrets-to-github)).

---

## Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value |
|------------|-------|
| `RCLONE_DROPBOX_TOKEN` | The JSON token from the Dropbox authorization |
| `RCLONE_GDRIVE_TOKEN` | The JSON token from the Google Drive authorization |

> ⚠️ **Security:** Tokens are only used during the workflow run and the rclone configuration file is deleted immediately after upload. Tokens are never logged or committed to the repository.

---

## Running the Workflow

1. Go to **Actions** → **Process Videos**
2. Click **Run workflow**
3. Configure the upload options:

| Input | Description | Default |
|-------|-------------|---------|
| **Upload to GitHub Releases** | Create a GitHub Release with zip files | `true` |
| **Upload to Dropbox** | Upload `.mp4` files to Dropbox | `false` |
| **Upload to Google Drive** | Upload `.mp4` files to Google Drive | `false` |
| **Folder name in Dropbox/Google Drive** | Destination folder name | `ProcessedVideos` |

4. Click **Run workflow**

### Example: Upload to Dropbox only

- ☑️ Upload to Dropbox: `true`
- ☐ Upload to GitHub Releases: `false`
- Folder: `MyVideos`

Files will appear in Dropbox at: `/MyVideos/20260303-100530/`

### Example: Upload to both Google Drive and GitHub Releases

- ☑️ Upload to GitHub Releases: `true`
- ☑️ Upload to Google Drive: `true`
- Folder: `ProcessedVideos`

---

## Troubleshooting

### Token expired

Rclone tokens include a `refresh_token` that auto-renews. If uploads fail with authentication errors, regenerate the token:

```bash
# Dropbox
rclone authorize "dropbox"

# Google Drive
rclone config reconnect gdrive:
```

Then update the corresponding GitHub secret.

### "Secret is not set" warning

If you see this warning in the workflow logs:
```
Dropbox upload selected but RCLONE_DROPBOX_TOKEN secret is not set — skipping
```

Make sure the secret name matches exactly: `RCLONE_DROPBOX_TOKEN` or `RCLONE_GDRIVE_TOKEN`.

### Upload speed is slow

The workflow uses 8 parallel transfers by default. Cloud provider API rate limits may affect speed. Dropbox and Google Drive both have daily upload limits — check your account quota if uploads fail partway through.

### Google Drive storage quota

Free Google accounts have 15 GB of storage. For large video batches, consider using Google Workspace or a dedicated service account with more quota.

### Dropbox storage quota

Free Dropbox accounts have 2 GB of storage. Dropbox Plus offers 2 TB. Ensure your account has enough space for all processed videos.
