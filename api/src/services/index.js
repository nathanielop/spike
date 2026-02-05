import { createServiceController } from 'bootman';

import db from '#src/services/db.js';
import http from '#src/services/http.js';
import processWork from '#src/services/process-work.js';

export default createServiceController({ http, db, processWork });
