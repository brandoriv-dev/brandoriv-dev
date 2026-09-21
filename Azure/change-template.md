# <Operation and target>

- Event time (UTC): <ISO 8601 timestamp; date/range if exact time is unknown>
- Recorded on (UTC): <ISO 8601 timestamp or date>
- Record type: <contemporaneous | reconstructed | correction>
- Actor: <person, agent, or automation identity; unknown if not retained>
- Environment and targets: <provider, environment, resource names/scopes>
- Status: <planned | applied and verified | applied with validation pending | partial | failed | rolled back>
- Source/action references: <repository SHA, PR, script path, deployment/run ID>
- Related records: <links; identify the authoritative record for a shared operation>

## Reason and change

<Why the operation was needed. What existed before, and what changed externally.
Separate observed values from intended configuration.>

## Execution

<Exact safe command or versioned script reference, relevant non-secret parameters,
and provider operation IDs. For a portal action, name the settings and their
before/after values. Do not include secret values or raw authenticated output.>

## Validation and evidence

<When and how the result was checked, observed outcome, and a durable evidence
reference. State what was not checked. A successful upload, merged PR, or health
endpoint alone does not prove every affected user flow works.>

## Rollback

<How to restore the prior verified state, retained artifact or revision required,
and any data/configuration limits. State whether rollback was performed.>

## Drift and follow-up

<Differences from infrastructure as code or tracked configuration, owner/issue for
the follow-up, and pending validation. Use none only when checked.>
