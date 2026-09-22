const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("คุยกับ AI")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("ข้อความที่ต้องการถาม AI")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("ลงทะเบียน /chat เรียบร้อยแล้ว");
})();

client.on("ready", () => {
  console.log(`บอทออนไลน์: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "chat") return;

  const message = interaction.options.getString("message");

  await interaction.deferReply();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "คุณเป็นบอทเพื่อนคุยภาษาไทย ตอบเป็นกันเอง กระชับ และเข้าใจง่าย"
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "AI ไม่สามารถตอบได้ตอนนี้";

    await interaction.editReply(answer.slice(0, 2000));
  } catch (error) {
    console.error(error);
    await interaction.editReply("เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ");
  }
});

client.login(process.env.DISCORD_TOKEN);
