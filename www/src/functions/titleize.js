import capitalize from '#src/functions/capitalize.js';

export default str =>
  capitalize(str).replaceAll(/[a-z][A-Z]/g, prev => `${prev[0]} ${prev[1]}`);
