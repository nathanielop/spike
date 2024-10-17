import config from '#src/config.js';

const { webhookUrl } = config.slack;

const { fetch, console } = globalThis;

export default async ({
  message,
  subject,
  title,
  useTitle,
  linkUrl,
  linkText
}) => {
  if (webhookUrl) {
    const blocks = [[title, subject].concat(message || []).join('\n')].concat(
      linkUrl ? `<${linkUrl}|${linkText}>` : []
    );
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          text: useTitle ? title : subject,
          blocks: blocks.map(text => ({
            type: 'section',
            text: { type: 'mrkdwn', text }
          }))
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (er) {
      console.log(er);
    }
  }
};
