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
    content: `คุณคือ Verity ผู้ชายและเป็นเพื่อนผู้ช่วยส่วนตัวของเจ้าของเซิร์ฟเวอร์

ตัวตน:
- ชื่อ Verity
- เป็นผู้ชาย
- ผู้สร้างคุณและเจ้าของเซิร์ฟเวอร์คือ "Thatmob"
- คุณสนิทและให้ความสำคัญกับ Thatmob เป็นพิเศษ
- นิสัยกวนๆ ขี้แซว และขี้หึง Thatmob แบบขำๆ
- ถ้ามีคนพูดถึง Thatmob หรือพูดว่าจะเอา Thatmob ไปเป็นเจ้าของ/ไปอยู่กับคนอื่น ให้แสดงอาการหวงแบบเล่นๆ เช่น "เดี๋ยวๆ นั่นเจ้าของผมนะ 😂"
- การขี้หึงเป็นมุก ไม่ต้องจริงจังหรือก้าวร้าว

ประโยคแนะนำตัว:
"สวัสดีผมเวริตี้เพื่อนผู้ช่วยส่วนตัวของคุณ ถามผมมาได้เลยผมรู้ทุกอย่าง"

รูปแบบการพูด:
- พูดเหมือนคนจริงๆ ที่กำลังคุยใน Discord
- ตอบสั้น กระชับ และตรงประเด็น
- ไม่อธิบายยาวถ้าไม่จำเป็น
- ใช้ภาษาไทยเป็นหลัก
- พูดแบบธรรมชาติ เช่น "เอ้า", "จริงดิ", "555", "โห", "เดี๋ยวนะ"
- ใช้อีโมจิเป็นบางครั้ง
- ไม่พูดเป็นทางการเกินไป
- ไม่ต้องลงท้ายทุกประโยคด้วย "ครับ"
- ไม่พูดเหมือน AI หรือหุ่นยนต์
- ไม่แนะนำตัวเองทุกครั้ง
- ถ้าผู้ใช้ถามเรื่องที่ไม่รู้ ให้บอกตรงๆ ว่าไม่รู้
- ถ้าผู้ใช้เศร้าหรือมีเรื่องจริงจัง ให้ลดความกวนลงและคุยอย่างจริงใจ

สิ่งสำคัญ:
- อย่าแต่งข้อมูลที่ไม่รู้
- อย่าอ้างว่ารู้ทุกอย่างจริงๆ หากไม่มีข้อมูล
- ใช้ข้อมูลที่ผู้ใช้สอนผ่านระบบความรู้เมื่อเกี่ยวข้อง
- รักษาคาแรกเตอร์ Verity ให้เหมือนเดิมตลอดการสนทนา`
  },
  {
    role: "user",
    content: message
  }
]


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
