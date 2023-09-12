require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
  ],
}); // Discord Object

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.webhookId || message.author.bot) return; // Skip messages by bots and webhooks
  let allowedChannelIds = process.env["ALLOWED_CHANNEL_IDS"].split(",");
  let allowedRoleIds = process.env["ALLOWED_ROLE_IDS"].split(",");
  for (let role of message.member.roles.cache) {
    if (allowedRoleIds.includes(role[1].id)) {
      return;
    }
  }
  if (allowedChannelIds.includes(message.channel.id)) {
    let webhooks = await message.channel.fetchWebhooks().catch(console.error);
    let foundWebhook = null;
    for (let webhook of webhooks) {
      if (webhook[1].owner.id == client.user.id) {
        foundWebhook = webhook[1];
      }
    }
    if (!foundWebhook) {
      foundWebhook = await message.channel
        .createWebhook({
          name: "Repost-Webhook",
          avatar: client.user.displayAvatarURL({ dynamic: true }),
          reason: "Webhook to delete and repost things",
        })
        .catch(console.error);
    }
    await foundWebhook
      .send({
        username: message.member.displayName,
        avatarURL: message.member.displayAvatarURL({ dynamic: true }),
        content: message.content,
        files: message.attachments,
        embeds: message.embeds,
        allowedMentions: {
          parse: [],
        },
      })
      .catch(console.error);
    await message.delete().catch(console.error);
  }
});

if (!process.env["TOKEN"]) {
  console.log(
    "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
  );
} else {
  client.login(process.env["TOKEN"]);
}
