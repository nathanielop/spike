export default async load =>
  await load.tx.first().from('seasons').whereNull('endedAt');
