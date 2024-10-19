export default {
  up: async tx =>
    await tx.schema
      .createTable('items', t => {
        t.text('id').primary();
        t.boolean('isForSale').notNullable();
        t.specificType('name', 'citext').notNullable();
        t.text('type').notNullable();
        t.text('description');
        t.integer('price').notNullable();
        t.integer('discountedPrice');
        t.integer('limitedTo');
        t.jsonb('attributes').notNullable();
        t.datetime('createdAt').notNullable();
      })
      .createTable('itemPurchases', t => {
        t.text('id').primary();
        t.boolean('isEquipped').notNullable();
        t.text('playerId')
          .notNullable()
          .references('players.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.text('itemId')
          .notNullable()
          .references('items.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.datetime('createdAt').notNullable();
      }),
  down: async tx =>
    await tx.schema.dropTable('items').dropTable('itemPurchases')
};
