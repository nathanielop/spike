import db from '#src/constants/db.ts';

export default {
  stop: async () => await db.destroy()
};
