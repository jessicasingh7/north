export async function recordIntegrationSync(workspace, integrationIds, syncedAt = new Date().toISOString()) {
  const current = (await workspace.syncStateStore.load()) ?? {};

  for (const integrationId of integrationIds) {
    current[integrationId] = {
      lastSyncedAt: syncedAt,
    };
  }

  await workspace.syncStateStore.save(current);
  return current;
}
