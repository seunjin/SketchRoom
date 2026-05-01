# Contributing

## Commit Convention

SketchRoom uses a lightweight Conventional Commits style.

```txt
<type>(optional scope): <summary>
```

Examples:

```txt
chore: initialize pnpm workspace
feat(server): add websocket gateway
fix(web): handle reconnect state
docs: update deployment notes
refactor(shared): extract websocket event types
test(server): add room broadcast tests
```

## Types

- `feat`: new user-facing behavior or capability
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting or visual-only changes without behavior changes
- `refactor`: code restructuring without behavior changes
- `test`: test additions or updates
- `chore`: tooling, setup, dependency, or repository maintenance
- `build`: build system or package configuration
- `ci`: CI/CD workflow changes

## Scopes

Use a scope when it clarifies the touched area:

- `web`
- `server`
- `shared`
- `repo`

## Rules

- Use imperative mood in the summary.
- Keep the summary under 72 characters when practical.
- Do not end the summary with a period.
- Use English commit messages for consistency with tooling and GitHub history.

## Recommended First Commit

```txt
chore(repo): initialize workspace
```
