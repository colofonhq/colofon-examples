# colofon-examples

Reference integrations and end-to-end demos against real OSS projects.

**Private repo. Early-stage. See [`colofon-docs`](https://github.com/colofonhq/colofon-docs) for the project plan.**

## What's in here

A tiny Node CLI, `@colofon/example-cli`, that exists only to be a real release. Every `v*` tag pushed to this repo triggers `.github/workflows/release.yml`, which:

1. Builds the CLI and packs it with `npm pack`.
2. Runs `actions/attest-build-provenance` to produce a Sigstore / SLSA v1 bundle over the tarball.
3. Runs [`colofonhq/colofon-agent`](https://github.com/colofonhq/colofon-agent) to wrap that attestation into a Colofon proof bundle against the approved-builder set in [`.colofon/builders.txt`](.colofon/builders.txt).
4. Uploads all three artefacts — tarball, SLSA bundle, Colofon bundle — to the GitHub release.

Anyone can verify the Colofon bundle client-side at [colofon-verifier](https://github.com/colofonhq/colofon-verifier) without seeing the rest of the build log.

## Trying it

```bash
# Pick a release
tag=v0.1.0

# Download the release assets
gh release download "$tag" --repo colofonhq/colofon-examples \
  --pattern '*.tgz' \
  --pattern 'colofon-bundle.json'

# Confirm the tarball hash matches what the bundle commits to
sha256sum colofon-example-cli-${tag#v}.tgz
jq -r '.metadata.binaryDigestSha256' colofon-bundle.json
# The two values should be identical.

# Drop colofon-bundle.json into the browser verifier:
open https://<your-vercel-url>/verify
```

## What this demo proves

The Colofon proof bundle ships with three binding public inputs:

- `binary_digest_high / binary_digest_low` — the SHA-256 of the released tarball, split into BN254-Fr halves.
- `approved_builder_root` — Merkle root of the canonical Fulcio identities listed in `.colofon/builders.txt`.
- `signer_commitment` — Poseidon2 hash binding the Fulcio pubkey to the builder identity used for Merkle membership.

In plain language: *this specific tarball was built by one of the CI identities in the committed approved-builders file, using a circuit whose bytecode hashes to the exact value committed in the bundle.*

The verifier checks all three without ever seeing the build environment, the full attestation payload, or the signing CA trust roots in-circuit (those are off-circuit, documented in the circuit's header comment).

## Local dev

```bash
npm install
npm run build
node dist/index.js version
node dist/index.js sha256 some-file.tgz
node dist/index.js inspect some-colofon-bundle.json
```

## Cutting the first release

Once this PR merges, push a `v0.1.0` tag. If the first release workflow run fails because the Fulcio-issued SAN URI doesn't match the one committed in `.colofon/builders.txt`, look at the error output for the actual URI, update `builders.txt`, and retag.
