# Npm Userscript

[Install on Greasyfork](https://greasyfork.org/en/scripts/559139-npm-userscript)

[Video demo on Bluesky](https://bsky.app/profile/bluwy.me/post/3ma4pgto2rs2x)

Various improvements and fixes for npmjs.com.

## Features

<!-- features-table-start -->

| Feature                         | Description                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-dependencies`           | Improved package dependencies tab with added peer dependencies info, optional dependencies info, and dependency semver ranges.                                                           |
| `better-versions`               | Improved package versions tab with compact table view, cumulated versions table, show tags next to versions, and fix provenance icon alignment.                                          |
| `dim-mode`                      | **[Disabled by default]** Make light mode less bright. Does not implement dark mode completely.                                                                                          |
| `fix-issue-pr-count`            | Show "Issue" and "Pull Requests" counts in the package sidebar. At the time of writing, npm's own implementation is broken for large numbers for some reason. This temporarily fixes it. |
| `fix-styles`                    | Fix various style issues on the npm site (mostly the package page at the moment).                                                                                                        |
| `helpful-links`                 | Add helpful links beside the package header for convenience.                                                                                                                             |
| `module-replacements`           | Suggest alternatives for the package based on "es-tooling/module-replacements" data set.                                                                                                 |
| `move-funding`                  | Move the "Fund this package" button to the bottom of the sidebar.                                                                                                                        |
| `no-code-beta`                  | Hide the "Beta" label in the package code tab because it has been working for around 3 years now.                                                                                        |
| `npm-create`                    | If the package is named `create-*`, change the suggested install command in the sidebar as `npm create *` instead of `npm install create-*`.                                             |
| `remember-banner`               | Remember the banner at the top of the page when dismissed, so it doesn't keep showing up.                                                                                                |
| `remove-runkit`                 | Remove the RunKit link as it's dead.                                                                                                                                                     |
| `unpacked-size-and-total-files` | Display the "Unpacked Size" and "Total Files" columns for older packages that lack the data.                                                                                             |
| `tarball-size`                  | Display the tarball size of the package.                                                                                                                                                 |

<!-- features-table-end -->

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsors">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
