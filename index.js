const http = require("http");

const port = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Verity is online!");
}).listen(port, "0.0.0.0", () => {
  console.log(`Web server running on port ${port}`);
});
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

  // เพิ่ม /สอน ตรงนี้
  const commands = [
  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("คุยกับ AI")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("ข้อความที่ต้องการถาม AI")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("สอน")
    .setDescription("สอนข้อมูลใหม่ให้บอท")
    .addStringOption(option =>
      option
        .setName("คำถาม")
        .setDescription("สิ่งที่อยากให้บอทจำ")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("คำตอบ")
        .setDescription("คำตอบที่บอทควรจำ")
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
  if (interaction.commandName === "สอน") {
  const fs = require("fs");

  const question = interaction.options.getString("คำถาม");
  const answer = interaction.options.getString("คำตอบ");

  let knowledge = {};

  if (fs.existsSync("knowledge.json")) {
    knowledge = JSON.parse(fs.readFileSync("knowledge.json", "utf8"));
  }

  knowledge[question] = answer;

  fs.writeFileSync(
    "knowledge.json",
    JSON.stringify(knowledge, null, 2)
  );

  await interaction.reply(`สอนสำเร็จ! 🧠\n${question} → ${answer}`);
  return;
}

if (interaction.commandName !== "chat") return;

  const message = interaction.options.getString("message");

const fs = require("fs");

let knowledge = {};

if (fs.existsSync("knowledge.json")) {
  knowledge = JSON.parse(fs.readFileSync("knowledge.json", "utf8"));
}

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
    content: `คุณเป็นบอทเพื่อนคุยภาษาไทย ตอบเป็นกันเอง กระชับ และเข้าใจง่าย

ข้อมูลที่ผู้ใช้สอนบอท:
${JSON.stringify(knowledge, null, 2)}

ถ้าคำถามเกี่ยวข้องกับข้อมูลที่สอนไว้ ให้ใช้ข้อมูลนั้นในการตอบ`
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

});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (!message.mentions.has(client.user)) return;

  const text = message.content
    .replace(`<@${client.user.id}>`, "")
    .trim();

  if (!text) {
    await message.reply("มีอะไรให้ช่วยไหม? 👀");
    return;
  }

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
            content: "คุณคือ Verity เพื่อนคุยภาษาไทย ตอบเป็นกันเอง กระชับ และเข้าใจง่าย"
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "ตอนนี้ฉันตอบไม่ได้ 😭";

    await message.reply(answer.slice(0, 2000));
  } catch (error) {
    console.error(error);
    await message.reply("เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ");
  }
});

client.login(process.env.DISCORD_TOKEN);
