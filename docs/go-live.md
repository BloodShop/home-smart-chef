# HomeSmartChef Go-Live

## What is ready

The app-side content platform is already implemented.

This repo now also contains:

- a publishable content directory at `apps/home-smart-chef/content/`
- a content refresh script at `apps/home-smart-chef/scripts/refresh-content.mjs`
- a GitHub Pages workflow at `.github/workflows/home-smart-chef-content-pages.yml`

That workflow publishes `apps/home-smart-chef/content` as a static site and refreshes the daily pack on a schedule.

## What is blocked right now

This machine is not authenticated to GitHub, and the git repo has no remote configured.

Because of that, I cannot complete the public publish step from here yet.

## Fastest path to live

1. Create or connect a GitHub repo for this git worktree.
2. Push the repo.
3. Enable GitHub Pages with "GitHub Actions" as the source.
4. Let the workflow deploy the content site.
5. Set the app config to the Pages base URL.

Expected content URL shape:

```text
https://<github-user>.github.io/<repo-name>
```

Then set:

- `expo.extra.contentBaseUrl` in `apps/home-smart-chef/app.json`
- or `EXPO_PUBLIC_CONTENT_BASE_URL` in the environment

Example:

```json
{
  "expo": {
    "extra": {
      "contentBaseUrl": "https://your-user.github.io/your-repo"
    }
  }
}
```

The app will then fetch:

- `https://your-user.github.io/your-repo/manifest.json`
- `https://your-user.github.io/your-repo/packs/daily-he-latest.json`

## Next step after publishing

After the Pages URL is live:

1. set `contentBaseUrl`
2. rebuild the Expo app
3. verify that Settings shows a remote sync time
4. add a real feedback API endpoint
5. move the content folder into its own repo if you want editorial workflows
