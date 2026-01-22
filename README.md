# Npm Userscript

[Install on Greasyfork](https://greasyfork.org/en/scripts/559139-npm-userscript)

[Video demo on Bluesky](https://bsky.app/profile/bluwy.me/post/3ma4pgto2rs2x)

[Screenshots on Bluesky](https://bsky.app/profile/bluwy.me/post/3mcw5cnaxqc25)

Various improvements and fixes for npmjs.com.

## Features

<!-- features-table-start -->

| Feature                         | Description                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-dependencies`           | Improved package dependencies tab with added peer dependencies info, optional dependencies info, and dependency semver ranges.                                                                                   |
| `better-versions`               | Improved package versions tab with compact table view, cumulated versions table, show tags next to versions, and fix provenance icon alignment.                                                                  |
| `dim-mode`                      | **[Disabled by default]** Make light mode less bright. Does not implement dark mode completely.                                                                                                                  |
| `fix-issue-pr-count`            | Show "Issue" and "Pull Requests" counts in the package sidebar. At the time of writing, npm's own implementation is broken for large numbers for some reason. This temporarily fixes it.                         |
| `fix-styles`                    | Fix various style issues on the npm site (mostly the package page at the moment).                                                                                                                                |
| `helpful-links`                 | Add helpful links beside the package header for convenience.                                                                                                                                                     |
| `module-replacements`           | Suggest alternatives for the package based on "es-tooling/module-replacements" data set.                                                                                                                         |
| `move-funding`                  | Move the "Fund this package" button to the bottom of the sidebar.                                                                                                                                                |
| `no-code-beta`                  | Hide the "Beta" label in the package code tab because it has been working for around 3 years now.                                                                                                                |
| `remember-banner`               | Remember the banner at the top of the page when dismissed, so it doesn't keep showing up.                                                                                                                        |
| `remove-runkit`                 | Remove the RunKit link as it's dead.                                                                                                                                                                             |
| `show-binary-label`             | Adds a label for packages that ship prebuilt native binaries.                                                                                                                                                    |
| `show-cli-label`                | Adds a label if the package ships a CLI via the package.json "bin" field, and update the install command to "npm create" or "npx" accordingly.                                                                   |
| `show-engine-label`             | Adds a label of the engine versions (e.g. Node.js) that a package supports.                                                                                                                                      |
| `show-file-types-label`         | Show ESM or CJS labels if the package ships them.                                                                                                                                                                |
| `show-lifecycle-scripts-label`  | Adds a label if the package defines lifecycle scripts in its package.json.                                                                                                                                       |
| `show-types-label`              | Adds a label for packages that ship types. This is similar to npm's own DT / TS icon but with a more consistent UI. It is also more accurate if the package ship types but isn't detectable in the package.json. |
| `show-vulnerabilities`          | Adds a label if a package is vulnerable in the header and versions table. The core vulnerability data is powered by https://osv.dev.                                                                             |
| `tarball-size`                  | Display the tarball size of the package.                                                                                                                                                                         |
| `unpacked-size-and-total-files` | Display the "Unpacked Size" and "Total Files" columns for older packages that lack the data.                                                                                                                     |

<!-- features-table-end -->

## Disclaimer

1. As npm updates their site, some features may break or behave unexpectedly until the userscript is updated accordingly. Please be aware especially when updating sensitive data.
2. The userscript fetches from https://npm-userscript.bjornlu.workers.dev (a custom Cloudflare Worker) that proxies data from other sources to save on bandwidth. Check the [worker](./worker/) directory for the source code.

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsors">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
