/**
 * @param {{
 *   field: string;
 *   table: string;
 *   ref?: boolean;
 *   type: string;
 *   [k: string]: any;
 * }} p0
 */
const createField = ({ field, table, ref, type, ...rest }) => ({
  ...rest,
  type,
  resolve: async ({ context: { load }, object }) => {
    const column = ref ? `${field}Id` : field;
    const value =
      column in object
        ? object[column]
        : object.id == null
          ? undefined
          : ((await load(table, object.id)) || {})[column];
    return ref ? value && { id: value } : value;
  }
});

export default ({ table, local = {}, references = {}, ...rest }) => ({
  cost: ({ cost, query }) =>
    // Add 1 for each field in the query that is not the id
    cost + Object.keys(query).filter(key => key !== 'id').length,
  ...rest,
  object: {
    id: createField({ field: 'id', table, type: 'id' }),
    createdAt: createField({ field: 'createdAt', table, type: 'datetime' }),
    ...Object.fromEntries(
      Object.entries(local).map(([field, type]) => [
        field,
        createField({ field, table, type })
      ])
    ),
    ...Object.fromEntries(
      Object.entries(references).map(([field, type]) => [
        field,
        createField({ field, ref: true, table, type })
      ])
    ),
    ...rest.fields
  }
});
