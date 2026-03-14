const axios = require("axios");

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

function formatTimestamp(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function postSlackMessage(payload) {
  if (!slackWebhookUrl) {
    return false;
  }

  await axios.post(slackWebhookUrl, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  return true;
}

async function sendIncidentStartedAlert(service, incident) {
  try {
    return await postSlackMessage({
      text: `Incident started for ${service.name}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              ":rotating_light: *Incident Started*\n" +
              `*Service:* ${service.name}\n` +
              "*Status:* DOWN\n" +
              `*URL:* ${service.url}\n` +
              `*Started At:* ${formatTimestamp(incident.started_at)}`,
          },
        },
      ],
    });
  } catch (error) {
    console.warn(
      `Slack warning: failed to send incident-started alert for ${service.name}.`,
      error.message
    );
    return false;
  }
}

async function sendIncidentResolvedAlert(service, incident) {
  try {
    return await postSlackMessage({
      text: `Incident resolved for ${service.name}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              ":white_check_mark: *Incident Resolved*\n" +
              `*Service:* ${service.name}\n` +
              "*Status:* UP\n" +
              `*Resolved At:* ${formatTimestamp(incident.resolved_at)}\n` +
              `*Downtime:* ${incident.duration_minutes} minutes`,
          },
        },
      ],
    });
  } catch (error) {
    console.warn(
      `Slack warning: failed to send incident-resolved alert for ${service.name}.`,
      error.message
    );
    return false;
  }
}

module.exports = {
  sendIncidentStartedAlert,
  sendIncidentResolvedAlert,
};
