import bootman from 'bootman';

import db from '#src/services/db.js';
import http from '#src/services/http.js';
import janitor from '#src/services/janitor.js';

export default bootman({ http, db, janitor });
