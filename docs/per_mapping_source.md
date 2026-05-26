# Per-mapping subject_source / object_source

SSSOM allows `subject_source` and `object_source` to live at the individual
mapping (row) level instead of the mapping-set metadata header. This is the
valid pattern for combined sets such as `mondo.sssom.tsv`, which merge
mappings from multiple sources.

## What the registry does

When the ETL parses an SSSOM file and finds that:

- `subject_source` (or `object_source`) is **absent** from the set-level
  metadata header, **but**
- the data table **does have a `subject_source` (or `object_source`) column**,

it records the value `mapping-commons:per_mapping` as a placeholder. This
makes the field count as present for the metadata-completeness score and
gives the search facet a single bucket grouping all per-mapping sets.

Set-level values, when present, are never overwritten.

## Permanently out of scope: prefix-implied sources

Some SSSOM files (e.g. `mondo.sssom.tsv`) declare **no** source — not at the
set level and not as a column. The source can be inferred from the prefix of
each `subject_id` / `object_id` (e.g. `MONDO:` → MONDO, `DOID:` → DOID), but
the registry will **not** perform this inference.

Reasons:

- The whole point of the metadata-completeness signal is to reward authors
  who declare their metadata explicitly. Inferring it silently would mask
  files that should be flagged as incomplete.
- Prefix-implied sources are a property of the mapping payload, not of the
  mapping set as a whole. The registry indexes set-level metadata only.

If a mapping set wants its source(s) discoverable here, it must declare them
either at the set level or as a `subject_source` / `object_source` column.
