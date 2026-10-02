# CareerAI — Data and Source Contract

## Data states

Use one of these values when displaying skill evidence:

- `known`: an observation exists and has a source.
- `unknown`: no observation yet; show a way to collect one.
- `stale`: source needs review; do not use for strong claims.
- `disputed`: user disagreed or correction is pending.

## Evidence sources

| Source | Meaning | Weight policy |
|---|---|---|
| `diagnostic` | Correct responses to the versioned short assessment | Coarse signal only; coverage shown |
| `self_report` | User-selected level | Low; never sole proof of readiness |
| `self_attested_project` | User describes project/contribution | Useful story evidence, not independently verified |
| `reviewed_project` | Mentor/reviewer confirms evidence | Higher confidence, still not employment proof |

## Source requirements

A source-sensitive record has:

- `source_label`
- `source_url` when available
- `checked_at`
- `version`
- `owner/editor`
- `notes` and limitations

Seed role profiles are explicitly labelled `CareerAI seed role profile` until replaced or reviewed. A seed profile must not be described as a live market survey.

## Job/opportunity contract (P1)

```text
company_name
role_title
employment_type
location
canonical_url
source_label
posted_or_checked_at
eligibility_notes
required_skill_ids
status: open | closed | unknown
```

No scraped personal data. No auto-apply. A closed/unknown listing is not shown as “apply now”.

## Export/delete

Before production:

- export profile/roadmap data as JSON,
- delete account-owned rows and private storage objects,
- explain provider-retained data outside our control,
- remove interview/resume content from logs and analytics.
