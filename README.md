# Windows Island GG · Public website

Turkish product, setup, privacy and terms pages for **Windows Island GG**, maintained by **GokayG**. The site is plain HTML, CSS and browser JavaScript. It needs no build step, runtime service, external font, package install or analytics script.

## Pages

- `index.html`: product overview and setup entry point.
- `setup.html`: seven-step Google Cloud / Desktop OAuth guide with project-aware Console links, transient own-email fields, service selection, exact scope copy controls, and outcomes.
- `privacy.html`: application Google data, local caches, Windows Credential Manager, optional AI transfers, deletion and website hosting disclosures.
- `terms.html`: use, third-party accounts, availability, existing software licenses and contact.

Contact: **ggunduz54@gmail.com**.

## GitHub Pages

Intended repository: `GokayG/windows-island-gg-site`.

Publish this folder as a standalone public repository. In GitHub **Settings → Pages**, use **Deploy from a branch**, branch `main`, folder `/ (root)`. The `.nojekyll` file keeps the site as plain static content.

Expected addresses after Pages deployment succeeds:

| Purpose | URL |
| --- | --- |
| Homepage | https://gokayg.github.io/windows-island-gg-site/ |
| Setup | https://gokayg.github.io/windows-island-gg-site/setup.html |
| Privacy | https://gokayg.github.io/windows-island-gg-site/privacy.html |
| Terms | https://gokayg.github.io/windows-island-gg-site/terms.html |
| OAuth authorized domain | `gokayg.github.io` |

These URLs identify the GokayG publisher site. Copying them into someone else's OAuth project does not confer domain ownership or Google verification. The guide makes this distinction visible. Production publishing and Google verification remain separate.

This repository contains the website only. It does not publish the desktop source repository or an installer, and it makes no installer-download or Google-verified claim.

## Local preview

Serve the folder with any static HTTP server. For example, if Python is installed:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. A preview banner appears on every hostname other than `gokayg.github.io`. Relative links work under the GitHub project-site path.

## Setup behavior

- The project identifier and email live only in the current page's memory; no localStorage, sessionStorage or network form submission is used.
- A valid-shaped project ID is appended only to explicitly authored Google Console links. Google still decides whether it exists and whether the user can access it.
- Email is never appended to URLs. No client JSON can be uploaded to the website.
- The scope copy value includes `openid`, `https://www.googleapis.com/auth/userinfo.email`, and only selected service scopes.
- Clipboard failures select the authored value and explain manual copy.
- The main path describes personal In production use. Testing remains an alternative with an explicit seven-day authorization limit.
- JavaScript disabled: all setup panels are displayed for manual use.

## Maintenance

Keep the application wizard's name, client name, service scopes, links and seven-step order in sync with this guide. Re-check linked official Google instructions when changing setup behavior. Re-check the actual desktop data paths before changing privacy claims. Hosting privacy is separate from desktop data handling.

Source review for the initial privacy text used the Google, secrets, AI and notification modules of Windows Island GG. Tokens and client configuration use Windows Credential Manager; task data, notification previews and chats use other local application storage. Google disconnect clears local Google session/cache but does not call Google's revoke endpoint. Selected AI requests can include current-conversation messages and clipboard text when a user invokes a text action.

No credentials, OAuth client JSON, account databases, installer binaries or application source are needed in this repository.
