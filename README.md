# Anime Fandom Test

This project is a static, mobile-first personality test for GitHub Pages. It asks 24 anime-fandom questions, computes the respondent's fandom tendencies across four axes, and shows a final result card with a share/save panel.

## Project structure

- `index.html` — page shell and screen flow
- `css/style.css` — responsive layout, theme, and UI styling
- `js/data.js` — all questions, scale labels, type names, and metadata
- `js/app.js` — Fisher-Yates shuffle, scoring, result generation, and sharing logic
- `assets/` — placeholder illustration files for the landing page and fallback art

## Editing the test

All content is intentionally easy to adjust in `js/data.js`:

- `questions`: edit question wording and axis mapping.
- `axes`: change the four fandom traits and their labels.
- `adjectiveByPair` and `nounByPair`: update the result naming logic.
- `typeMeta`: change each type's tagline and description text.
- `scale`: alter the 7-point Likert labels if needed.

## Deployment

Live URL: https://yuyeon-a.github.io/connection-care/

### Steps

1. Make the repository public in GitHub.
2. Open Settings → Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to `main` or run the workflow manually from the Actions tab.

### Redeploying

- Push new commits to `main` to trigger the workflow automatically.
- Or open the GitHub Actions tab and run the Pages workflow manually with `workflow_dispatch`.

### Pre-share checklist

- Repository is public.
- Pages source is set to GitHub Actions.
- The `SITE_URL` constant matches the live domain.
- `assets/og.png` and `assets/favicon.png` exist and are correct.
- The repo includes `.nojekyll` and the Pages workflow file.

### Changing the live URL

The canonical site URL is defined in `js/app.js` as `SITE_URL` and repeated in `index.html` metadata. If the repository is renamed or a custom domain is added, update those values to match the new public URL.

### Kakao share setup

The app supports Kakao sharing when `KAKAO_KEY` is set in `js/app.js`:

```js
const KAKAO_KEY = "";
```

To enable KakaoTalk share:

1. Open the Kakao Developers console.
2. Register the domain `https://<OWNER>.github.io` for the app.
3. Create a JavaScript app and copy the JavaScript key.
4. Paste the key in the constant above.
5. Leave it empty if you want the app to fall back to native sharing or clipboard copy.

## Adding artwork

In the static GitHub Pages setup, the app tries to load images in this order:

1. `assets/hero.png` for the start screen
2. `assets/default.svg` as a quick fallback illustration
3. `assets/types/{TYPE_CODE}.png` for each type result card
4. `assets/types/default.svg` as the final fallback

If a file is missing, the app automatically falls back to a simple inline SVG or default SVG so the result image still renders correctly.
