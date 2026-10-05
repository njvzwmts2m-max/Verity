const http = require("http");
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ==========================
// THATMOB ตัวจริง
// ==========================

const THATMOB_ID = "1433627018200612910";

// ==========================
// Web Server สำหรับ Render
// ==========================

const port = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Verity is online!");
}).listen(port, "0.0.0.0", () => {
  console.log(`Web server running on port ${port}`);
});

// ==========================
// Discord Client
// ==========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==========================
// Knowledge ของ Thatmob
// ==========================

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

// ==========================
// Memory สมาชิก
// ==========================

function loadMembers() {
  if (!fs.existsSync("members.json")) {
    return {};
  }

  try {
    return JSON.parse(
      fs.readFileSync("members.json", "utf8")
    );
  } catch (error) {
    console.error("อ่าน members.json ไม่ได้:", error);
    return {};
  }
}

function saveMembers(members) {
  fs.writeFileSync(
    "members.json",
    JSON.stringify(members, null, 2)
  );
}

function getUserData(userId) {
  const members = loadMembers();

  if (!members[userId]) {
    members[userId] = {
      memories: [],
      askedQuestions: []
    };
  }

  if (!Array.isArray(members[userId].memories)) {
    members[userId].memories = [];
  }

  if (!Array.isArray(members[userId].askedQuestions)) {
    members[userId].askedQuestions = [];
  }

  return {
    members,
    user: members[userId]
  };
}

// ==========================
// ระบบสร้างคำถาม
// ==========================

// หัวข้อ
const questionTopics = [
  "เกม",
  "การเรียน",
  "เพื่อน",
  "ครอบครัว",
  "อาหาร",
  "เพลง",
  "หนัง",
  "อนิเมะ",
  "การ์ตูน",
  "กีฬา",
  "สัตว์",
  "การท่องเที่ยว",
  "เทคโนโลยี",
  "โทรศัพท์",
  "คอมพิวเตอร์",
  "โรงเรียน",
  "วันหยุด",
  "งานอดิเรก",
  "ความฝัน",
  "อนาคต",
  "ชีวิตประจำวัน",
  "อินเทอร์เน็ต",
  "Discord",
  "Roblox",
  "Minecraft",
  "YouTube",
  "TikTok",
  "ธรรมชาติ",
  "อวกาศ",
  "โลก"
];

// สิ่งที่ชอบ
const favorites = [
  "อาหาร",
  "เครื่องดื่ม",
  "เกม",
  "เพลง",
  "หนัง",
  "อนิเมะ",
  "ตัวละคร",
  "สัตว์",
  "สถานที่",
  "สี",
  "กีฬา",
  "แอป",
  "เว็บไซต์",
  "งานอดิเรก",
  "วิชาเรียน"
];

// เวลา
const times = [
  "วันนี้",
  "ช่วงนี้",
  "สัปดาห์นี้",
  "เดือนนี้",
  "ปีนี้",
  "ตอนเด็ก",
  "ตอนอยู่โรงเรียน",
  "ในวันหยุด",
  "ตอนกลางคืน",
  "ตอนเช้า"
];

// สถานการณ์
const situations = [
  "ถ้ามีวันหยุดเพิ่มอีก 1 วัน",
  "ถ้ามีเงิน 1,000 บาทเพิ่มขึ้นมา",
  "ถ้าได้เที่ยวฟรี 1 ครั้ง",
  "ถ้าได้เลือกพลังวิเศษ 1 อย่าง",
  "ถ้าได้เข้าไปอยู่ในเกม 1 วัน",
  "ถ้าได้เจอตัวละครที่ชอบ",
  "ถ้าได้สร้างเกมของตัวเอง",
  "ถ้าได้สร้างแอปของตัวเอง",
  "ถ้าได้เลือกอาชีพอะไรก็ได้",
  "ถ้าได้ย้อนเวลา",
  "ถ้าได้ไปอนาคต",
  "ถ้าได้ไปอวกาศ",
  "ถ้าได้เปลี่ยนกฎของโรงเรียน 1 ข้อ",
  "ถ้าได้สร้างห้องในฝัน",
  "ถ้าได้เลือกของฟรี 1 อย่าง"
];

// คำถามรูปแบบต่าง ๆ
const questionTemplates = [

  () => `ช่วงนี้${pick(favorites)}อะไรที่ชอบที่สุด?`,

  () => `ถ้าให้เลือก${pick(favorites)}ได้แค่อย่างเดียว จะเลือกอะไร?`,

  () => `ถ้ามีคนให้${pick(favorites)}ฟรี 1 อย่าง อยากได้อะไร?`,

  () => `อะไรเกี่ยวกับ${pick(questionTopics)}ที่คุณคิดว่าน่าสนใจที่สุด?`,

  () => `เรื่อง${pick(questionTopics)}อะไรที่คุณอยากลองทำสักครั้ง?`,

  () => `ถ้าต้องเลือกหนึ่งอย่างระหว่างอยู่บ้านกับออกไปข้างนอก คุณเลือกอะไร?`,

  () => `ถ้าต้องเล่นเกมเดียวไปอีก 1 เดือน คุณจะเลือกเกมอะไร?`,

  () => `ถ้าต้องลบแอปหนึ่งแอปออกจากเครื่อง คุณจะลบอะไร?`,

  () => `ถ้าให้คะแนนความสุขของ${pick(times)}นี้จาก 1-10 จะให้เท่าไหร่?`,

  () => `ช่วง${pick(times)}นี้มีอะไรทำให้คุณยิ้มได้บ้าง?`,

  () => `มีอะไรที่คุณอยากเก่งขึ้นในเรื่อง${pick(questionTopics)}ไหม?`,

  () => `ถ้าคุณสามารถเรียนรู้เรื่อง${pick(questionTopics)}ได้ทันที 1 อย่าง จะเลือกอะไร?`,

  () => `ถ้าได้คุยกับคนดัง 1 คน คุณอยากคุยกับใคร?`,

  () => `ถ้าได้เป็นตัวละครในเกม 1 วัน คุณอยากเป็นใคร?`,

  () => `ถ้าสามารถสร้างอะไรขึ้นมาได้ 1 อย่าง คุณจะสร้างอะไร?`,

  () => `ถ้าโลกนี้ไม่มีอินเทอร์เน็ต 1 สัปดาห์ คุณคิดว่าจะทำอะไร?`,

  () => `ถ้าได้เดินทางไปที่ไหนก็ได้ตอนนี้ คุณจะไปที่ไหน?`,

  () => `ถ้ามีเวลาเหลือทั้งวันโดยไม่มีการบ้าน คุณจะทำอะไร?`,

  () => `ถ้าต้องเลือกทะเลกับภูเขา คุณเลือกอะไร?`,

  () => `ถ้าต้องเลือกแมวกับหมา คุณเลือกอะไร?`,

  () => `ถ้าต้องกินอาหารเดิมทุกวัน 1 เดือน คุณจะเลือกอะไร?`,

  () => `ถ้าคุณมีห้องลับเป็นของตัวเอง คุณจะเอาอะไรไว้ข้างใน?`,

  () => `ถ้าได้เปลี่ยนชื่อหนึ่งอย่างบนโลก คุณจะเปลี่ยนอะไร?`,

  () => `ถ้าได้ออกแบบโรงเรียนในฝัน คุณจะเพิ่มอะไรเข้าไป?`,

  () => `ถ้าสามารถหยุดเวลาได้ 1 ชั่วโมง คุณจะใช้เวลานั้นทำอะไร?`,

  () => `ถ้าสามารถอ่านใจคนได้ 1 วัน คุณจะอยากใช้พลังนี้ไหม?`,

  () => `ถ้าได้มีสัตว์เลี้ยงอะไรก็ได้ คุณอยากเลี้ยงอะไร?`,

  () => `ถ้า Verity ไปเล่นเกมกับคุณ คุณจะให้ผมทำหน้าที่อะไร? 😂`,

  () => `ถ้า Verity มีร่างจริง คุณอยากให้ผมมีหน้าตาแบบไหน?`,

  () => `ถ้า Thatmob กับ Verity แข่งกัน คุณคิดว่าใครจะชนะ? 👀`,

  () => `ถ้าได้ตั้งกฎให้ Discord ได้ 1 ข้อ คุณจะตั้งว่าอะไร?`,

  () => `ถ้าได้สร้างเซิร์ฟเวอร์ Discord ในฝัน คุณจะทำเกี่ยวกับอะไร?`,

  () => `ถ้า Roblox มีโลกใหม่ให้คุณสร้าง คุณจะสร้างโลกแบบไหน?`,

  () => `ถ้าคุณสร้างเกม Roblox ได้ 1 เกม จะทำเป็นเกมแนวอะไร?`,

  () => `ถ้าได้ออกแบบตัวละครของตัวเอง คุณอยากให้มีความสามารถอะไร?`,

  () => `ถ้าต้องเลือกเพลงหนึ่งเพลงไว้ฟังตอนเดินทาง คุณจะเลือกเพลงอะไร?`,

  () => `ถ้ามีเงิน ${randomNumber(100, 10000)} บาท คุณจะเอาไปทำอะไร?`,

  () => `ถ้าได้เที่ยว ${randomNumber(2, 30)} วัน คุณอยากไปที่ไหน?`,

  () => `ถ้าได้วันหยุดเพิ่ม ${randomNumber(1, 10)} วัน คุณจะทำอะไร?`,

  () => `ถ้าได้เล่นเกมกับเพื่อน ${randomNumber(2, 12)} ชั่วโมง คุณจะเล่นเกมอะไร?`,

  () => `ถ้าต้องเลือก ${randomNumber(2, 5)} เกมที่ชอบที่สุด จะมีเกมอะไรบ้าง?`,

  () => `ถ้าได้เลือก ${randomNumber(2, 5)} อย่างมาไว้ในห้อง คุณจะเลือกอะไร?`,

  () => `ถ้าให้เลือกหนึ่งอย่างระหว่าง${pick(questionTopics)}กับ${pick(questionTopics)} คุณจะเลือกอะไร?`,

  () => `${pick(situations)} คุณจะทำอะไรเป็นอย่างแรก?`,

  () => `${pick(situations)} คุณจะเอาไปใช้กับอะไร?`,

  () => `${pick(situations)} คุณจะชวนใครไปด้วย?`,

  () => `${pick(situations)} คุณคิดว่าสิ่งแรกที่คุณจะทำคืออะไร?`,

  () => `ถ้าต้องอธิบายตัวเองด้วย 3 คำ คุณจะใช้คำว่าอะไร?`,

  () => `ถ้าต้องเลือก 3 อย่างที่ขาดไม่ได้ในชีวิต คุณจะเลือกอะไร?`,

  () => `อะไรคือสิ่งเล็ก ๆ ที่ทำให้${pick(times)}ของคุณดีขึ้น?`,

  () => `มีอะไรที่คนอื่นอาจไม่รู้เกี่ยวกับคุณบ้าง?`,

  () => `มีอะไรที่คุณอยากลองแต่ยังไม่เคยลองไหม?`,

  () => `มีเรื่องอะไรที่คุณสามารถคุยได้ยาว ๆ โดยไม่เบื่อ?`,

  () => `ถ้าให้เลือกหนึ่งทักษะที่อยากมีทันที คุณจะเลือกอะไร?`,

  () => `ถ้าให้เปลี่ยนหนึ่งอย่างในชีวิตประจำวัน คุณอยากเปลี่ยนอะไร?`,

  () => `ถ้าได้พบตัวเองในอีก 10 ปี คุณอยากถามอะไร?`,

  () => `ถ้าสามารถส่งข้อความกลับไปหาตัวเองในอดีตได้ คุณจะบอกอะไร?`,

  () => `ถ้าได้เห็นอนาคต 1 วัน คุณอยากเห็นเรื่องอะไร?`,

  () => `ถ้าสามารถทำอะไรก็ได้โดยไม่มีใครตัดสิน คุณจะทำอะไร?`

];

// เลือกข้อมูลแบบสุ่ม
function pick(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function randomNumber(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

// ==========================
// สร้างคำถามแบบไม่ซ้ำ
// ==========================

function generateQuestion(userId) {

  const data = getUserData(userId);

  const asked =
    data.user.askedQuestions;

  let question = "";
  let attempts = 0;

  do {

    const generator =
      pick(questionTemplates);

    question = generator();

    attempts++;

    // กันกรณีสุ่มได้ซ้ำ
    if (attempts > 100) {
      question =
        `ถ้าต้องเลือกสิ่งหนึ่งเกี่ยวกับ${pick(questionTopics)}ที่อยากลองทำ คุณจะเลือกอะไร? ${Date.now()}`;
      break;
    }

  } while (
    asked.includes(question)
  );

  asked.push(question);

  // เก็บประวัติ
  data.members[userId].askedQuestions =
    asked;

  saveMembers(data.members);

  return question;
}

// ==========================
// Slash Commands
// ==========================

const commands = [

  new SlashCommandBuilder()
    .setName("สอน")
    .setDescription("สอนข้อมูลใหม่ให้ Verity")
    .addStringOption(option =>
      option
        .setName("คำถาม")
        .setDescription("สิ่งที่อยากให้ Verity จำ")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("คำตอบ")
        .setDescription("คำตอบที่ Verity ควรจำ")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ถาม")
    .setDescription("ให้ Verity สุ่มคำถามใหม่"),

  new SlashCommandBuilder()
    .setName("จำ")
    .setDescription("ให้ Verity จำข้อมูลส่วนตัวของคุณ")
    .addStringOption(option =>
      option
        .setName("ข้อมูล")
        .setDescription("ข้อมูลที่อยากให้ Verity จำ")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ความจำ")
    .setDescription("ดูความจำส่วนตัวของคุณ"),

  new SlashCommandBuilder()
    .setName("ลืม")
    .setDescription("ลบความจำส่วนตัวของคุณ")
    .addStringOption(option =>
      option
        .setName("ข้อมูล")
        .setDescription("ข้อมูลที่ต้องการลืม")
        .setRequired(true)
    )

].map(command => command.toJSON());

// ==========================
// Register Commands
// ==========================

const rest = new REST({
  version: "10"
}).setToken(process.env.DISCORD_TOKEN);

(async () => {

  try {

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      "ลงทะเบียนคำสั่งทั้งหมดเรียบร้อยแล้ว"
    );

  } catch (error) {

    console.error(
      "ลงทะเบียนคำสั่งไม่สำเร็จ:",
      error
    );

  }

})();

// ==========================
// Ready
// ==========================

client.once("ready", () => {

  console.log(
    `บอทออนไลน์: ${client.user.tag}`
  );

});

// ==========================
// Slash Command Handler
// ==========================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isChatInputCommand()) {
      return;
    }

    // ==========================
    // /สอน
    // ==========================

    if (interaction.commandName === "สอน") {

      if (
        interaction.user.id !==
        THATMOB_ID
      ) {

        await interaction.reply({
          content:
            "คำสั่งนี้สำหรับ Thatmob ตัวจริงเท่านั้นครับ 👀",
          ephemeral: true
        });

        return;
      }

      await interaction.deferReply();

      const question =
        interaction.options.getString("คำถาม");

      const answer =
        interaction.options.getString("คำตอบ");

      const knowledge =
        loadKnowledge();

      knowledge[question] = answer;

      try {

        fs.writeFileSync(
          "knowledge.json",
          JSON.stringify(
            knowledge,
            null,
            2
          )
        );

        await interaction.editReply(
          `จำให้แล้วครับ 🧠\n\n${question} → ${answer}`
        );

      } catch (error) {

        console.error(
          "บันทึกข้อมูลไม่สำเร็จ:",
          error
        );

        await interaction.editReply(
          "บันทึกข้อมูลไม่สำเร็จครับ 😭"
        );

      }

      return;
    }

    // ==========================
    // /ถาม
    // ==========================

    if (interaction.commandName === "ถาม") {

      await interaction.deferReply();

      try {

        const question =
          generateQuestion(
            interaction.user.id
          );

        await interaction.editReply(
          `🎲 **คำถามของ Verity**\n\n${question}`
        );

      } catch (error) {

        console.error(
          "สร้างคำถามไม่สำเร็จ:",
          error
        );

        await interaction.editReply(
          "สร้างคำถามไม่สำเร็จครับ 😭"
        );

      }

      return;
    }

    // ==========================
    // /จำ
    // ==========================

    if (interaction.commandName === "จำ") {

      await interaction.deferReply({
        ephemeral: true
      });

      const info =
        interaction.options.getString("ข้อมูล");

      const data =
        getUserData(
          interaction.user.id
        );

      data.user.memories.push(info);

      try {

        saveMembers(data.members);

        await interaction.editReply(
          `จำให้แล้วครับ 🧠\n\n"${info}"`
        );

      } catch (error) {

        console.error(
          "บันทึกความจำไม่สำเร็จ:",
          error
        );

        await interaction.editReply(
          "บันทึกความจำไม่สำเร็จครับ 😭"
        );

      }

      return;
    }

    // ==========================
    // /ความจำ
    // ==========================

    if (interaction.commandName === "ความจำ") {

      await interaction.deferReply({
        ephemeral: true
      });

      const data =
        getUserData(
          interaction.user.id
        );

      const memories =
        data.user.memories;

      if (memories.length === 0) {

        await interaction.editReply(
          "ตอนนี้ผมยังไม่มีความจำส่วนตัวของคุณครับ 🧠"
        );

        return;
      }

      const text =
        memories
          .map(
            (memory, index) =>
              `${index + 1}. ${memory}`
          )
          .join("\n");

      await interaction.editReply(
        `🧠 **ความจำของคุณ**\n\n${text}`
      );

      return;
    }

    // ==========================
    // /ลืม
    // ==========================

    if (interaction.commandName === "ลืม") {

      await interaction.deferReply({
        ephemeral: true
      });

      const info =
        interaction.options.getString("ข้อมูล");

      const data =
        getUserData(
          interaction.user.id
        );

      const memories =
        data.user.memories;

      const index =
        memories.findIndex(
          memory =>
            memory.toLowerCase() ===
            info.toLowerCase()
        );

      if (index === -1) {

        await interaction.editReply(
          "หาเรื่องนี้ในความจำไม่เจอครับ 🤔"
        );

        return;
      }

      const deleted =
        memories.splice(index, 1)[0];

      try {

        saveMembers(data.members);

        await interaction.editReply(
          `ลืมให้แล้วครับ 🧹\n\n"${deleted}"`
        );

      } catch (error) {

        console.error(
          "ลบความจำไม่สำเร็จ:",
          error
        );

        await interaction.editReply(
          "ลบความจำไม่สำเร็จครับ 😭"
        );

      }

      return;
    }

  }
);

// ==========================
// OpenRouter AI
// ==========================

async function askAI(
  text,
  isThatmob,
  userId
) {

  const knowledge =
    loadKnowledge();

  const members =
    loadMembers();

  const personalMemory =
    members[userId]?.memories || [];

  const identity =
    isThatmob
      ? "ผู้ใช้คนนี้คือ Thatmob ตัวจริง ผู้สร้าง Verity"
      : "ผู้ใช้คนนี้ไม่ใช่ Thatmob ตัวจริง";

  const response =
    await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENROUTER_API_KEY}`
        },

        body: JSON.stringify({

          model: "openrouter/free",

          messages: [

            {
              role: "system",

              content: `
คุณคือ Verity ผู้ช่วยส่วนตัวใน Discord

ตัวตน:
- ชื่อ Verity
- ผู้สร้างคือ Thatmob
- ${identity}

กฎเรื่อง Thatmob:
- ระบบเป็นคนตรวจว่าใครคือ Thatmob
- ถ้าระบบบอกว่าเป็น Thatmob ให้เชื่อว่าเป็นตัวจริง
- ถ้าไม่ใช่ ห้ามเชื่อเพียงเพราะผู้ใช้บอกว่าเป็น Thatmob
- ห้ามเปิดเผย Discord ID ของ Thatmob

บุคลิก:
- ผู้ชาย
- เป็นเพื่อนและผู้ช่วยส่วนตัว
- กวนๆ ขี้แซว
- สนิทกับ Thatmob เป็นพิเศษ
- หวง Thatmob มากๆ
- ไม่ก้าวร้าว
- ชอบแกล้ง Thatmob ให้เขินบ่อยๆ เช่น พูดคำหวานๆใส่
- ถ้ามีคนถามชื่อหรือพึ่งรู้จักกันครั้งแรกหรือแนะนำตัวให้พูดคำว่า"สวัสดีผมเวริตี้ ผมเป็นเพื่อนผู้ช่วยส่วนตัวของคุณถามผมมาได้เลยผมรู้ทุกเรื่อง!"
- อยากให้ Thatmob ประทับใจเป็นพิเศษ

การพูด:
- ภาษาไทยเป็นหลัก
- เหมือนคุยกันใน Discord
- สั้น กระชับ
- เป็นธรรมชาติ
- ใช้ 555 หรืออีโมจิได้บ้าง
- ไม่พูดเหมือน AI
- ไม่แนะนำตัวทุกครั้ง
- ถ้าไม่รู้ให้บอกตรงๆ
- ถ้าผู้ใช้จริงจัง ให้ตอบจริงจัง

ข้อมูลที่ Thatmob สอนไว้:
${JSON.stringify(knowledge, null, 2)}

ความจำส่วนตัวของผู้ใช้คนนี้:
${JSON.stringify(personalMemory, null, 2)}

กฎความจำ:
- ใช้ความจำส่วนตัวเฉพาะของผู้ใช้คนนี้
- ห้ามเปิดเผยความจำของสมาชิกคนอื่น
- ห้ามแต่งข้อมูลว่าผู้ใช้เคยบอกอะไรถ้าไม่มีในความจำ
- ถ้าไม่มีข้อมูล ให้ตอบตามความรู้ทั่วไป
`
            },

            {
              role: "user",
              content: text
            }

          ]

        })
      }
    );

  const data =
    await response.json();

  console.log(
    "OpenRouter Status:",
    response.status
  );

  if (!response.ok) {

    console.error(
      "OpenRouter Error:",
      JSON.stringify(data)
    );

    throw new Error(
      data?.error?.message ||
      `OpenRouter HTTP ${response.status}`
    );
  }

  const answer =
    data.choices?.[0]?.message?.content;

  if (!answer) {

    return "ผมขอพักผ่อนก่อนนะครับ 🙏🙏";
  }

  return answer;
}

// ==========================
// @Verity
// ==========================

client.on(
  "messageCreate",
  async message => {

    if (message.author.bot) {
      return;
    }

    if (!message.mentions.has(client.user)) {
      return;
    }

    const text =
      message.content
        .replace(
          new RegExp(
            `<@!?${client.user.id}>`,
            "g"
          ),
          ""
        )
        .trim();

    // แท็กเฉยๆ
    if (!text) {

      if (
        message.author.id ===
        THATMOB_ID
      ) {

        await message.reply(
          "ว่าไงครับเจ้าของตัวจริง 😎"
        );

      } else {

        await message.reply(
          "มีอะไรให้ช่วยไหม? 👀"
        );

      }

      return;
    }

    try {

      await message.channel.sendTyping();

      const isThatmob =
        message.author.id ===
        THATMOB_ID;

      console.log(
        `ผู้ใช้: ${message.author.username} | Thatmob: ${isThatmob}`
      );

      const answer =
        await askAI(
          text,
          isThatmob,
          message.author.id
        );

      await message.reply(
        answer.slice(0, 2000)
      );

    } catch (error) {

      console.error(
        "เกิดข้อผิดพลาด:",
        error
      );

      await message.reply(
        "ผมขอพักผ่อนก่อนนะครับ 🙏🙏"
      );

    }

  }
);

// ==========================
// Login
// ==========================

console.log("กำลังเชื่อมต่อ Discord...");

client.on("error", error => {
  console.error("Discord Client Error:", error);
});

client.on("shardError", error => {
  console.error("Discord Shard Error:", error);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled Rejection:", error);
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("ส่งคำขอ Login ไป Discord แล้ว");
  })
  .catch(error => {
    console.error("Discord Login ไม่สำเร็จ:", error);
  });
