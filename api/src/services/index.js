import bootman from 'bootman';

import db from '#src/services/db.js';
import http from '#src/services/http.js';
import processWork from '#src/services/process-work.js';

export default bootman({ http, db, processWork });
