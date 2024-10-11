import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'players',
  local: {
    id: 'id',
    name: 'string',
    imageUrl: 'url'
  }
});
