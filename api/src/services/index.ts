import bootman from 'bootman';

import db from '#src/services/db.ts';
import http from '#src/services/http.ts';

export default bootman({ http, db });
