import createId from '#src/functions/create-id.js';
import workTypes from '#src/work-types/index.js';

export default async ({ type, load, data }) => {
  if (!(type in workTypes)) {
    throw new Error(`Invalid work type ${type}`);
  }

  await load.tx
    .insert({ id: createId(), type, data, createdAt: new Date() })
    .into('work');
};
