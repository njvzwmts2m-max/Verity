const http = require("http");
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const port = process.env.PORT || 10000;

// ====================
// Web Server
// ====================
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Verity is online!");
}).listen(port, "0.0.0.0", () => {
  console.log(`Web server running on port ${port}`);
});

// ====================
// Discord Client
// ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ====================
// Knowledge
// ====================
function loadKnowledge() {
  if (!fs.existsSync("knowledge.json")) {
    return {};
  }

  try {
    return JSON.parse(
      fs.readFileSync("knowledge.json", "utf8")
    );
  } catch (error) {
    console.error("อ่าน knowledge.json ไม่ได้:", error);
    return {};
  }
}

// ====================
// /สอน
// ====================
const commands = [
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

// ====================
// Register Commands
// ====================
const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN
);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("ลงทะเบียน /สอน เรียบร้อยแล้ว");
  } catch (error) {
    console.error("ลงทะเบียนคำสั่งไม่สำเร็จ:", error);
  }
})();

// ====================
// Ready
// ====================
client.on("ready", () => {
  console.log(`บอทออนไลน์: ${client.user.tag}`);
});

// ====================
// /สอน
// ====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "สอน") return;

  const question = interaction.options.getString("คำถาม");
  const answer = interaction.options.getString("คำตอบ");

  const knowledge = loadKnowledge();

  knowledge[question] = answer;

  fs.writeFileSync(
    "knowledge.json",
    JSON.stringify(knowledge, null, 2)
  );

  await interaction.reply(
    `สอนสำเร็จ! 🧠\n${question} → ${answer}`
  );
});

// ====================
// AI
// ====================
async function askAI(text) {
  const knowledge = loadKnowledge();

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
            content: `คุณคือ Verity ผู้ชายและเป็นเพื่อนผู้ช่วยส่วนตัวของเจ้าของเซิร์ฟเวอร์

ตัวตน:
- ชื่อ Verity
- เป็นผู้ชาย
- ผู้สร้างคุณและเจ้าของเซิร์ฟเวอร์คือ "Thatmob"
- คุณสนิทกับ Thatmob เป็นพิเศษ
- นิสัยกวนๆ ขี้แซว และหวง Thatmob แบบขำๆ
- ถ้ามีคนพูดถึง Thatmob ให้แสดงอาการหวงแบบเล่นๆ
- ไม่ก้าวร้าว

รูปแบบการพูด:
- พูดเหมือนคนจริงๆ ใน Discord
- ตอบสั้น กระชับ และตรงประเด็น
- ใช้ภาษาไทยเป็นหลัก
- พูดเป็นธรรมชาติ
- ใช้ 555 หรืออีโมจิบางครั้ง
- ไม่พูดเป็นทางการเกินไป
- ไม่พูดเหมือน AI
- ไม่แนะนำตัวเองทุกครั้ง
- ถ้าไม่รู้ ให้บอกตรงๆ ว่าไม่รู้
- ถ้าผู้ใช้จริงจัง ให้ลดความกวนลง

ข้อมูลที่ผู้ใช้สอนไว้:
${JSON.stringify(knowledge, null, 2)}

กฎสำคัญ:
- ถ้าคำถามตรงหรือเกี่ยวข้องกับข้อมูลที่ผู้ใช้สอนไว้ ให้ใช้ข้อมูลนั้นเป็นหลัก
- อย่าเปลี่ยนคำตอบที่ผู้ใช้สอนไว้เอง
- อย่าแต่งข้อมูลขึ้นมา
- ถ้าไม่มีข้อมูลที่เกี่ยวข้อง ค่อยตอบตามความรู้ทั่วไป`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    }
  );

  const data = await response.json();

  return (
    data.choices?.[0]?.message?.content ||
    "ตอนนี้ผมตอบไม่ได้ 😭"
  );
}

// ====================
// @Verity
// ====================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (!message.mentions.has(client.user)) return;

  const text = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  if (!text) {
    await message.reply("มีอะไรให้ช่วยไหม? 👀");
    return;
  }

  try {
    await message.channel.sendTyping();

    const answer = await askAI(text);

    await message.reply(
      answer.slice(0, 2000)
    );
  } catch (error) {
    console.error(error);

    await message.reply(
      "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ"
    );
  }
});

// ====================
// Login
// ====================
client.login(process.env.DISCORD_TOKEN);
