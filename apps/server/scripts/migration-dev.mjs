#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error(
    'Usage: pnpm db:migration:dev <MigrationName>\nExample: pnpm db:migration:dev AddRoomParticipant',
  );
  process.exit(1);
}

if (!/^[A-Z][A-Za-z0-9]*$/.test(migrationName)) {
  console.error(
    'MigrationName must be PascalCase and contain only letters or numbers.',
  );
  process.exit(1);
}

const commands = [
  [
    'pnpm',
    [
      'migration:generate',
      `src/database/migrations/${migrationName}`,
    ],
  ],
  [
    'pnpm',
    [
      'exec',
      'prettier',
      '--write',
      'src/database/migrations/*.ts',
    ],
  ],
  ['pnpm', ['migration:run']],
  ['pnpm', ['migration:show']],
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
