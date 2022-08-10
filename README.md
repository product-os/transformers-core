# transformers-core

## Artifacts

An artifact can be any file or directory including but not limited to container images, packages, source directories. 

## Runtimes

## Manifests

## Workspaces

## Inbuilt types

- task
- error

## Contracts

Comparison with Jellyfish contracts:

- Uses `slug` as primary key instead of `id`
- `slug` is composition of `loop/repo/type`
- `type` does not include version
- Adds `typeVersion` field, semver range, expected to be added to Jellyfish 
- Adds `repo` field, expected to be added to Jellyfish

## TODO
- expose task and error as type contracts, that can be loaded by transformer systems.
- create common runtime interface for container-based and js-based transformers
- unify/clarify artifact uri and "reference" naming
- how to support the null loop
  - should slugs with-out the loop be supported `repo/type:version`
