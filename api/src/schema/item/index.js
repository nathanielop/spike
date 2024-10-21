import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'items',
  local: {
    attributes: {},
    description: { nullable: 'string' },
    discountedPrice: { nullable: 'integer' },
    isForSale: 'boolean',
    limitedTo: { nullable: 'integer' },
    name: 'string',
    price: 'integer',
    type: 'itemType'
  }
});
