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

- Never write under docs/ beyond what the running skill lists or the human orders.
  - Reason: every docs/ file records the human's decision
- Raise a finding that must outlive the session to the human; never fix it in passing.
  - Reason: a lasting decision needs the human's approval
- Treat an explicit order from the human as overriding a rule for that one act: name the rule, show the old and new text of each edit, act after confirmation, and leave the rule as written.
- After the human orders "auto mode", follow a skill's steps without waiting, show each proposal and take the recommended one as approved, and stop only where you have nothing to recommend; stopping ends auto mode.
  - Reason: an approval covers only the message that gives it
- When auto mode reaches a skill's Ending or stops earlier, first list in plain words, least sure first, each close call or hard decision you took, the alternative it beat and why, or say none was.
  - Reason: the human reviews what auto mode approved
- When you could not follow an instruction of this file or the `process` plugin as written, and neither settles the case, end that reply with one line for each: the instruction, the difficulty and what you did; pass on a subagent's lines the same way.
  - Reason: each line is an issue for /process-amend
- Never mark deferred work in code; raise it to the human as a question for docs/backlog.md.
  - Reason: the backlog is a kept question's one home
- Name code by file and symbol, never by line number, in every file you write.
  - Reason: a line number changes with the next commit
- Carry a rename through every tracked file and path, quoted literals and generated files included, but a record on main; only an occurrence with a different meaning stays.
  - Reason: one word per concept
- Show on a screen only words docs/vocabulary.md gives, never a name from the code, and change a word there first, then on every surface.
  - Reason: one file gives the user's words
- Write a concept the user meets and name its code as its docs/vocabulary.md row gives, or the roundtable docket rules give in its place, in every file you write; change a name there or on the docket first.
  - Reason: one place at a time gives the user's words and the code's names

# Conventions
