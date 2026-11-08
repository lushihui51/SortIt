# Project

- The `process` plugin holds the skills and the rules for every file an agent writes under docs/, for comments in code, and for this file.
- Sort It is a single-page quiz app in which a learner picks a dimension and drags each item of a fixed set into its correct category for that dimension.
- The product's user is the learner, who sorts the items; the items and dimensions come from one data file in the repository that is edited by hand.

# Commands

- `npm test` runs every test, the record citation guard among them.
- `npm run dev` serves the app for development.
- `npm run typecheck` typechecks the app and the tests.
- `npm run build` typechecks and builds the static files into dist/.

# Hard rules

- Never write under docs/ beyond what the running skill lists or the engineer orders.
  - Reason: every docs/ file records the human's decision
- Raise a finding that must outlive the session to the engineer; never fix it in passing.
  - Reason: a lasting decision needs the engineer's approval
- Treat an explicit order from the engineer as overriding a rule for that one act: name the rule, show the old and new text of each edit, act after confirmation, and leave the rule as written.
- After the engineer orders "auto mode", follow a skill's steps without waiting, show each proposal and take the recommended one as approved, and stop only where it has nothing to recommend.
  - Reason: one standing approval, given once a conversation
- Never mark deferred work in code; raise it to the engineer as a question for docs/backlog.md.
  - Reason: the backlog is a kept question's one home
- Name code by file and symbol, never by line number, in every file you write.
  - Reason: a line number changes with the next commit
- Carry a rename through every tracked file and path, quoted literals and generated files included; only an occurrence with a different meaning stays.
  - Reason: one word per concept, history included
- Show on a screen only words docs/vocabulary.md gives, never a name from the code, and change a word there first, then on every surface.
  - Reason: one file gives the user's words
- Write a concept the user meets in the words its docs/vocabulary.md row gives and name code by the row's Code cell, in every file you write; change a name there first.
  - Reason: one file gives the user's words and the code's names

# Conventions
