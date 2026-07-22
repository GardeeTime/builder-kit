---
name: schema-scrub
description: Clean db/schema.rb before pushing a Rails migration PR so it only contains changes from the current branch — not leaks from other local branches whose migrations have been applied to the dev database.
---

# Schema Scrub

Cleans `db/schema.rb` so it reflects `main` plus *only this branch's* migrations — stripping out unrelated changes that leaked in from other feature branches whose migrations have been applied to the local database.

## Why this exists

Rails regenerates `schema.rb` from the **entire local database state** on every `bin/rails db:migrate`, not just the current branch's migrations. When developers run multiple feature branches concurrently, tables/columns/indexes from unrelated branches routinely leak into `schema.rb` when migrating on a new branch. Pushing that unclean schema causes merge conflicts, phantom schema changes on `main`, and confused reviewers.

If the repo has a `db/README.md` documenting the canonical fix workflow, that document takes precedence over this command. This command automates the standard cleanup process.

## When to run

- Any time the current branch touches `db/migrate/` or `db/schema.rb`
- Before committing, or before pushing if already committed
- Safe no-op if no migrations are involved — just exits

## Steps

### 1. Sanity checks

```bash
git rev-parse --show-toplevel       # repo root
git rev-parse --abbrev-ref HEAD     # current branch
ls db/schema.rb Gemfile             # confirm this is a Rails repo
```

- If `git rev-parse --show-toplevel` fails, stop — not in a git repo.
- If `db/schema.rb` or `Gemfile` is missing, stop — this command targets Rails repos only.
- If current branch is `main` or `master`, stop and tell the user — there's nothing to scrub.

### 2. Detect whether this branch has a migration

```bash
git diff --name-only main...HEAD -- 'db/migrate/*.rb' db/schema.rb
git diff --name-only -- 'db/migrate/*.rb' db/schema.rb              # uncommitted
git ls-files --others --exclude-standard -- 'db/migrate/*.rb'       # untracked
```

If none of these commands return any files, exit with: "No migration detected on this branch — nothing to scrub." Do not proceed.

Otherwise, capture the list of migration files that belong to this branch (committed, uncommitted, and untracked). These define the **expected** schema changes. Store this list — you'll use it in step 5.

### 3. Reset schema.rb to main

```bash
git checkout main -- db/schema.rb
```

This overwrites the working-tree `db/schema.rb` with main's version. Any uncommitted edits to `schema.rb` are discarded — that's intentional, since the whole point is to rebuild it cleanly.

If the user has uncommitted changes elsewhere in the working tree, leave those alone. Only `db/schema.rb` is being reset.

### 4. Re-run migrations

```bash
bin/rails db:migrate
```

Rails applies any pending migrations (including this branch's) and regenerates `schema.rb`. If the server is running locally, this is safe — migrations are additive. If migrations fail, stop and report the error verbatim.

### 5. Analyze the diff

```bash
git diff db/schema.rb
```

Read each migration file captured in step 2 and list what tables/columns/indexes/foreign-keys each one should add, remove, or modify. Then walk through each hunk in the `git diff db/schema.rb` output and classify it:

- **✓ Expected** — the hunk matches an intent from this branch's migrations
- **Version bump** — the `version:` on line ~13 should match the **latest** migration timestamp in this branch (always expected)
- **⚠ Unrelated** — the hunk touches a table/column/index/foreign-key that none of this branch's migrations mention

Common unrelated-change patterns to watch for:
- Whole new tables appearing or disappearing
- Columns added to unrelated tables
- Column reorderings within existing tables
- Foreign-key reorderings in the `add_foreign_key` block at the bottom
- Index name or ordering changes
- Whitespace-only JSONB default reformatting (e.g., `{ "x" => nil }` vs `{"x"=>nil}`)

Report the classification to the user as a compact table. Example:

```
Hunk                                                  Status
----------------------------------------------------  ----------
Line 13: version bump to <timestamp>                   Expected
Line 492: <table> adds <columns>                       Expected (matches <migration_filename>)
Line 90: <unrelated_table> whitespace reformat         ⚠ Unrelated — revert
Line 379: <unrelated_table> table removed              ⚠ Unrelated — revert
```

### 6. Handle unrelated changes

If all hunks are Expected: move to step 7.

If any hunks are flagged Unrelated: list them to the user and ask how to proceed. Default recommendation is to revert them by editing `db/schema.rb` to match what's on `main` for those specific lines. The user can:
- Approve "revert all flagged hunks" → do the edits in one pass
- Approve specific hunks to revert → do just those
- Override (rare — only if the user knows a leaked change is actually wanted)

After reverting, re-run `git diff db/schema.rb` to confirm the diff is now clean (Expected hunks only).

### 7. Stage and offer to commit

Once the diff is clean:

```bash
git add db/schema.rb db/migrate/
git status
```

Show the staged changes. Ask the user whether to commit now (with a suggested message like `Scrub db/schema.rb for <branch description>`) or leave staged for them to commit with their own message. Do not auto-commit without confirmation.

## Safety notes

- **Never** edit `db/schema.rb` by hand outside this workflow — all schema changes must come from migrations.
- **Never** run `bin/rails db:schema:load` as a shortcut — it destroys and rebuilds the entire DB. Only `db:migrate` is correct here.
- **Never** run this on `main` or `master` — there's no branch to scrub.
- If `bin/rails db:migrate` fails, stop and show the user the raw error. Don't try to force the schema clean through other means; fix the migration first.
- If the repo has a `db/README.md`, treat it as the canonical reference. If it disagrees with this command, trust the README and update this command.
