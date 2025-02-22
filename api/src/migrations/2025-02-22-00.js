import createId from '#src/functions/create-id.js';

export default {
  up: async tx => {
    await tx.schema.createTable('seasons', t => {
      t.text('id').primary();
      t.integer('season').notNullable();
      t.text('firstPlacePlayerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('secondPlacePlayerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('thirdPlacePlayerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.datetime('createdAt').notNullable();
      t.datetime('endedAt');
      t.datetime('endsAt');
    });

    await tx.schema.table('series', t => {
      t.text('seasonId')
        .references('seasons.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
    });

    await tx
      .insert({
        id: createId(),
        season: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        endsAt: new Date('2025-03-01T00:00:00Z')
      })
      .into('seasons');

    const [seasonId] = await tx.pluck('id').from('seasons');

    await tx.table('series').update({ seasonId });

    await tx.schema.table('series', t => {
      t.dropColumn('season');
      t.text('seasonId').notNullable().alter();
    });
  },
  down: async tx => await tx.schema.dropTable('seasons')
};
