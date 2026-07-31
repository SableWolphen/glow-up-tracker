# Building the signed PlushLife Android release

This can't run inside the Claude Code sandbox — there's no Android SDK there
and no network path to Google's SDK servers. It runs in
`.github/workflows/android-release.yml` instead, triggered manually from the
GitHub Actions tab. This file explains the one-time setup and the keystore
handling — read it before the first run.

## 1. Create the upload keystore (once, on your own machine)

```
keytool -genkeypair -v \
  -keystore plushlife-upload.keystore \
  -alias plushlife-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for a keystore password and a key password (they can be the
same value or different — either is fine, just record both). This keystore
**is your app's permanent identity on Google Play.** Losing it means you can
never publish an update to `com.PlushLife` again under the same listing —
Google cannot recover or reset it for you.

## 2. Store it somewhere durable, not in this repo

- Keep the `.keystore` file in a password manager's file storage, an
  encrypted drive, or a private cloud folder you control — never in Git,
  never in a Slack/email attachment.
- Write down both passwords and the key alias somewhere alongside it.
- Make at least one offline backup copy (a second encrypted drive, printed
  recovery info, etc.). This is the single most unrecoverable secret in the
  whole project.

`.gitignore` already excludes `*.jks`, `*.keystore`, and `keystore.properties`
repo-wide as a safety net, but the real protection is simply never putting
the file in a folder that gets committed.

## 3. Add it to GitHub Actions as secrets (once)

Repo → **Settings → Secrets and variables → Actions → New repository secret**,
four secrets:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i plushlife-upload.keystore` (macOS/Linux: `base64 -i file`, or `base64 -w0 file` on some Linux distros to avoid line wraps) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password from step 1 |
| `ANDROID_KEY_ALIAS` | `plushlife-upload` (or whatever alias you chose) |
| `ANDROID_KEY_PASSWORD` | the key password from step 1 |

These are encrypted at rest by GitHub, only exposed to workflow runs as
environment variables, and never appear in logs (GitHub automatically
redacts secret values that show up in step output).

## 4. Run the build

Repo → **Actions → Build signed Android App Bundle → Run workflow**. It asks
for two inputs:

- **versionCode** — a plain increasing integer (1, 2, 3, …). Google Play
  rejects any upload whose versionCode isn't higher than what's already
  live, so bump this every release.
- **versionName** — the human-readable version string shown to users, e.g.
  `1.0.0`.

The workflow builds `www/` from the current repo state (same as
`scripts/sync-www.js` does locally), syncs it into the Android project,
decodes the keystore into a throwaway file that only exists for the duration
of the job, signs the release bundle with it, deletes that decoded file
immediately after (even if the build fails), and uploads the resulting
`app-release.aab` as a downloadable workflow artifact.

**It does not publish anything.** Download the artifact from the completed
run and upload it to Play Console yourself.

## What never gets committed

- The keystore file itself
- Its passwords
- The key alias's password
- Any decoded/temporary copy of the above (the workflow cleans this up as
  its own last step, `if: always()`, so it runs even on build failure)

## Local development builds

`./gradlew assembleDebug` (or opening `android/` in Android Studio) doesn't
need any of the above — Android's own auto-generated debug keystore handles
that, and the `signingConfigs.release` block in `android/app/build.gradle`
only activates when the four `PLUSHLIFE_*` environment variables are present,
which they only are inside the CI workflow.
