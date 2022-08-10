# Contract spec

This spec describes the generic concept of contracts, which will allow us to model various entities and the 
relationships between them.

## Authoring contracts

Working with a contract as a user should be as simple as possible. If the contract is authored in a source repo, only 
`type`,`version` and `typeVersion` fields are necessary. The author may also rely on versioning tools to set the `version` 
and `typeVersion` if available.

The `name` and `loop` field are not required, they are inferred from the repo origin `owner` and `name` respectively.

## Properties

### slug

Human consumable unique identifier, no two contracts may share the same `slug`.

Formatted using the `loop`, `name`, `type` and `version` fields of a contract.

Formatted as follows `<loop>/<name>/<type>@<version>`

### loop


### name 

The identity of the entity, must be unique to its loop, may have various forms with distinct types.

For example in a `my-loop` their might be a `my-api` entity, with a contract for each type; `source`, `service` and 
`docs`.

This would result in three contracts with the following slugs:
- `my-loop/my-api/source@1.0.0`
- `my-loop/my-api/service@1.0.0`
- `my-loop/my-api/docs@1.0.0`

### type

### typeVersion

### version

Semantic version string if the entity has related versions.

Random uuid if the entity has many unrelated versions.



	
