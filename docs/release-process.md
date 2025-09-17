# Release and Publishing Guide

This document describes how to cut a release and publish the extension to both the VS Code Marketplace and Open VSX using the repository's GitHub Actions workflows.

## Overview

- Trigger model: pushing a `v*` tag starts the unified pipeline in `.github/workflows/release.yml` that builds, creates a GitHub Release (attaching the VSIX and changelog), and publishes to both stores.
- Two entry points to create that tag:
  1) Version bump with computed next version: `.github/workflows/version-bump.yml` (manual dispatch with `release_type`).
  2) Release without bump (tag only): `.github/workflows/release-only.yml` (manual dispatch with `version`).
- Manual reruns or republish attempts should be performed by re-running the relevant job inside `release.yml`; there is no separate fallback workflow.

## Prerequisites

- Secrets configured in the repository:
  - `VSCE_PAT`: Personal Access Token for VS Code Marketplace publish.
  - `OPEN_VSX_TOKEN`: Token for Open VSX publish.
- Permissions: The default `GITHUB_TOKEN` is used for tagging and creating releases.
- Node.js: Workflows use Node 20 on GitHub-hosted runners.

## Changelog Policy

- Do not pre-write the next release section in `CHANGELOG.md`.
- The changelog is updated automatically by the Version Bump workflow via `taj54/universal-version-bump`.
- “Release Only” does not modify `CHANGELOG.md`. If a section for the version is missing, the GitHub Release will include a placeholder body.
- GitHub Releases also enable `generate_release_notes: true` for extra context.

## Standard Release (with version bump)

1) Prepare changes on a branch, open a PR, and merge to `main`.
2) Manually run the workflow: Actions → “Version Bump” (`.github/workflows/version-bump.yml`).
   - Input `release_type`: `patch`, `minor`, or `major`.
3) The workflow bumps the version (and updates `CHANGELOG.md`), pushes a release branch, opens a PR, and creates/pushes tag `vX.Y.Z` on the bump commit.
4) Tag push triggers `release.yml`, which:
   - Checks out and builds (`npm ci`, `npm run build`).
   - Packages the extension (`vsce package`) and attaches `*.vsix` to a GitHub Release named `Release vX.Y.Z` with changelog content.
   - Publishes to both registries using `HaaLeo/publish-vscode-extension@v2` (`skipDuplicate: true`).
5) Verify:
   - GitHub Releases page shows “Release vX.Y.Z” with assets.
   - Extension listing updates on VS Code Marketplace and Open VSX.
6) Merge the auto-created release PR so that `main` reflects the version bump and changelog updates.

## Release Only (no version bump)

Use this when the version is already set in `package.json`.

1) Ensure `package.json` contains the intended version `X.Y.Z`.
2) Manually run Actions → “Release Only (Tag and Trigger)” (`.github/workflows/release-only.yml`).
   - Input `version`: `X.Y.Z`.
   - The workflow validates that the input matches `package.json`.
3) The workflow creates and pushes tag `vX.Y.Z`, which triggers `release.yml` for build, GitHub Release creation, and publishing (same as above).

## Manual Re-run / Republish

If publishing fails or assets need to be regenerated, re-run the failed job (or the entire workflow) inside `release.yml` from the Actions tab. The workflow is idempotent thanks to `skipDuplicate: true` on both registries.

## Failure Modes and Troubleshooting

- No notable commits detected for changelog:
  - Ensure commits follow Conventional Commits (e.g., `feat:`, `fix:`). The generator will still create a placeholder if nothing is found.
- Tag already exists when bumping or releasing only:
  - Use a new version or delete the remote tag if appropriate: `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` (be cautious if already published).
- Marketplace/Open VSX publish fails:
  - Confirm `VSCE_PAT` / `OPEN_VSX_TOKEN` are set and valid.
  - Re-run the `release.yml` workflow; publishing is idempotent with `skipDuplicate: true`.
- Changelog content truncated on GitHub Release:
  - Ensure a newline at end of file and add a subsequent heading (e.g., `## [Unreleased]`) so the extractor block has a proper terminator.
- Release pipeline triggered before PR merge:
  - This is expected when using Version Bump. Wait for `release.yml` to finish, review artifacts, then merge the release PR.

## Policy Notes

- Versions follow plain `X.Y.Z` semantic versioning in automation paths. Pre-releases (e.g., `1.2.3-beta.1`) are not currently supported by the pre-validation step.
- Do not edit generated assets under `dist/`; always release from a clean build on CI.

## Files Involved

- `.github/workflows/version-bump.yml` – Bumps version, updates `CHANGELOG.md`, pushes a release branch/PR, and tags `vX.Y.Z`.
- `.github/workflows/release.yml` – Builds, creates GitHub Release with changelog, and publishes to both stores on `v*` tag.
- `.github/workflows/release-only.yml` – Validates input against `package.json` and triggers the release pipeline by tagging without touching `CHANGELOG.md`.
