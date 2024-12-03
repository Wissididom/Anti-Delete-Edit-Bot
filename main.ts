import { Client, Events, GatewayIntentBits, Partials } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
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

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.webhookId || message.author.bot) return; // Skip messages by bots and webhooks
  if (message.channel.isDMBased() || message.channel.isThread()) return;
  const allowedChannelIds = Deno.env.get("ALLOWED_CHANNEL_IDS")?.split(",") ??
    [];
  const allowedRoleIds = Deno.env.get("ALLOWED_ROLE_IDS")?.split(",") ?? [];
  for (const role of message.member?.roles.cache ?? []) {
    if (allowedRoleIds.includes(role[1].id)) {
      return;
    }
  }
  if (allowedChannelIds.includes(message.channel.id)) {
    const webhooks = await message.channel.fetchWebhooks().catch(console.error);
    let foundWebhook = null;
    if (webhooks) {
      for (const [id, webhook] of webhooks) {
        if (webhook.owner.id == client.user?.id) {
          foundWebhook = webhook;
        }
      }
    }
    if (!foundWebhook) {
      foundWebhook = await message.channel
        .createWebhook({
          name: "Repost-Webhook",
          avatar: client.user?.displayAvatarURL(),
          reason: "Webhook to delete and repost things",
        })
        .catch(console.error);
    }
    await foundWebhook
      .send({
        username: message.member?.displayName,
        avatarURL: message.member?.displayAvatarURL(),
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

const token = Deno.env.get("TOKEN");

if (!token) {
  console.log(
    "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
  );
} else {
  client.login(token);
}
