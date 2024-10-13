import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';

const { allowedEmailDomains } = config.jtspike;

export default {
  input: {
    object: {
      allowPluses: { type: 'boolean', defaultValue: false },
      allowedDomains: { arrayOf: 'string', defaultValue: allowedEmailDomains }
    },
    defaultValue: {}
  },
  resolve: ({ input: { allowPluses, allowedDomains }, path, value }) => {
    if (!value.includes('@')) {
      throw new PublicError(
        `Expected a value of type email at ${path.join('.')} but got ${JSON.stringify(value)}`
      );
    }

    const [localPart, domain] = value.split('@');

    if (localPart.includes('+') && !allowPluses) {
      throw new PublicError(
        `Email addresses with a plus sign are not allowed at ${path.join('.')}`
      );
    }

    if (!allowedDomains.includes(domain)) {
      throw new PublicError(
        `Email address domain ${domain} is not allowed at ${path.join('.')}`
      );
    }

    return value;
  }
};
