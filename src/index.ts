#!/usr/bin/env node
// Tiny demo CLI:
//   colofon-example sha256 <file>       compute a file's SHA-256
//   colofon-example inspect <bundle>    print the subject digest a
//                                       Colofon proof bundle commits to
//   colofon-example version             print the release tag
//
// The point isn't what the CLI does; it's that it ships with a
// Colofon proof bundle attached to every release. Run
//   colofon-example sha256 path/to/downloaded.tgz
// and cross-reference the hex with what the bundle shows in the
// verifier to see the whole chain line up.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const PKG_VERSION = '__COLOFON_EXAMPLE_CLI_VERSION__';

function sha256Hex(path: string): string {
  const bytes = readFileSync(path);
  return createHash('sha256').update(bytes).digest('hex');
}

interface BundleSubset {
  readonly metadata?: {
    readonly binaryDigestSha256?: string;
    readonly builderIdentityUri?: string;
  };
  readonly circuit?: {
    readonly name?: string;
    readonly bytecodeHash?: string;
  };
  readonly publicInputs?: readonly string[];
}

function inspectBundle(path: string): void {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as BundleSubset;
  const digest = parsed.metadata?.binaryDigestSha256 ?? '<missing>';
  const builder = parsed.metadata?.builderIdentityUri ?? '<unknown>';
  const circuit = parsed.circuit?.name ?? '<unknown>';
  const bytecodeHash = parsed.circuit?.bytecodeHash ?? '<missing>';
  const publicInputs = parsed.publicInputs?.length ?? 0;

  console.log('circuit:           ' + circuit);
  console.log('bytecode hash:     ' + bytecodeHash);
  console.log('public inputs:     ' + publicInputs + ' fields');
  console.log('claimed builder:   ' + builder);
  console.log('binary sha256:     ' + digest);
}

function usage(): void {
  console.log('colofon-example v' + PKG_VERSION);
  console.log('');
  console.log('Usage:');
  console.log('  colofon-example sha256 <file>');
  console.log('  colofon-example inspect <bundle.json>');
  console.log('  colofon-example version');
}

const [, , cmd, ...rest] = process.argv;
switch (cmd) {
  case 'sha256': {
    const target = rest[0];
    if (!target) {
      console.error('colofon-example sha256: path required');
      process.exit(2);
    }
    console.log(sha256Hex(target));
    break;
  }
  case 'inspect': {
    const target = rest[0];
    if (!target) {
      console.error('colofon-example inspect: path to bundle.json required');
      process.exit(2);
    }
    inspectBundle(target);
    break;
  }
  case 'version':
    console.log(PKG_VERSION);
    break;
  case undefined:
  case '-h':
  case '--help':
    usage();
    break;
  default:
    console.error('colofon-example: unknown command "' + cmd + '"');
    usage();
    process.exit(2);
}
