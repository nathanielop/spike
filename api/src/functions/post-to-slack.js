import config from '#src/config.js';

const { webhookUrl } = config.slack;

const { fetch, console } = globalThis;

export default async ({ message, subject, title, useTitle }) => {
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          text: useTitle ? title : subject,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${title}\n${subject}${message ? `\n${message}` : ''}`
              }
            }
          ]
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (er) {
      console.log(er);
    }
  }
};
