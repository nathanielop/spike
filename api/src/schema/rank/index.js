import ranks from '#src/constants/ranks.js';
import createEnumType from '#src/functions/create-enum-type.js';

export default createEnumType(Object.keys(ranks));
