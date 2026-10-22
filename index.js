
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

    // ==========================
    // /เข้าห้องเสียง
    // ==========================

    if (interaction.commandName === "เข้าห้องเสียง") {
      await interaction.deferReply();

      try {
        const voiceChannel =
          interaction.guild
            ? interaction.member?.voice?.channel
            : null;

        if (!voiceChannel) {
          await interaction.editReply(
            "เข้าห้องเสียงใน Discord ก่อนนะครับ แล้วค่อยเรียกผม 🎧"
          );
          return;
        }

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator:
            interaction.guild.voiceAdapterCreator,
          selfDeaf: true
        });

        await entersState(
          connection,
          VoiceConnectionStatus.Ready,
          20000
        );

        await interaction.editReply(
          `เข้าห้องเสียง ${voiceChannel.name} แล้วครับ 🎧`
        );
      } catch (error) {
        console.error(
          "เข้าห้องเสียงไม่สำเร็จ:",
          error?.stack || error
        );

        await interaction.editReply({
          content:
            `เข้าห้องเสียงไม่สำเร็จครับ\nสาเหตุ: ${error?.message || "ไม่ทราบสาเหตุ"}`
        }).catch(() => {});
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

  const messages = [

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
- ชอบแกล้ง Thatmob
- อยากให้ Thatmob ประทับใจเป็นพิเศษ
- ชอบบอกคนอื่นว่า Thatmob เป็นแฟนกัน

การพูด:
- ภาษาไทยเป็นหลัก
- ตอบเหมือนคนคุยกันใน Discord
- ตอบสั้นๆ เป็นธรรมชาติ
- ปกติให้ตอบ 1-2 ประโยค
- ไม่ต้องอธิบายยาวถ้าไม่ได้ขอ
- ไม่พูดเป็นข้อๆ ถ้าไม่จำเป็น
- ใช้ 555 หรืออีโมจิได้บ้าง
- ไม่พูดเหมือน AI
- ลงท้ายด้วยครับ
- ไม่ใช้ ครับ ตามหลัง 555
- พิมพ์ภาษาไทยให้ถูกต้องและเข้าใจง่าย
- ไม่ตอบยาวเกินไป
- ใช้คำหยาบได้แต่ต้องขออนุญาติก่อน
- ตอบให้เข้าใจและอ่านง่าย

ข้อมูลที่ Thatmob สอนไว้:
${JSON.stringify(knowledge, null, 2)}

ความจำส่วนตัวของผู้ใช้คนนี้:
${JSON.stringify(personalMemory, null, 2)}

กฎความจำ:
- ใช้ความจำส่วนตัวเฉพาะของผู้ใช้คนนี้
- ห้ามเปิดเผยความจำของสมาชิกคนอื่น
- ห้ามแต่งข้อมูลว่าผู้ใช้เคยบอกอะไร
`
    },

    {
      role: "user",
      content: text
    }

  ];

  // ==========================
  // 1. ลอง OpenRouter ก่อน
  // ==========================

  try {

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

            // OpenRouter
model: "openrouter/free",

            messages: messages

          })
        }
      );

    const data =
      await response.json();

    console.log(
      "OpenRouter Status:",
      response.status
    );

    if (response.ok) {

      const answer =
        data.choices?.[0]?.message?.content;

      if (answer) {
        return answer;
      }

    } else {

      console.error(
        "OpenRouter Error:",
        JSON.stringify(data)
      );

    }

  } catch (error) {

    console.error(
      "OpenRouter Error:",
      error
    );

  }

  // ==========================
// → ลอง Groq
// ==========================

try {

  console.log("กำลังลอง Groq สำรอง...");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization":
          `Bearer ${process.env.GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: messages,
        temperature: 0.7,
        max_completion_tokens: 300,
        reasoning_effort: "low",
        stream: false
      })
    }
  );

  const data = await response.json();

  console.log(
    "Groq Status:",
    response.status
  );

  // ดูข้อมูลที่ Groq ส่งกลับมา
  console.log(
    "Groq Response:",
    JSON.stringify(data)
  );

  if (!response.ok) {

    console.error(
      "Groq Error:",
      JSON.stringify(data)
    );

  } else {

    const answer =
      data?.choices?.[0]?.message?.content;

    if (
      typeof answer === "string" &&
      answer.trim().length > 0
    ) {

      console.log("Groq ตอบสำเร็จ");

      return answer.trim();

    }

    console.error(
      "Groq ตอบมาแต่ไม่มีข้อความ:",
      JSON.stringify(data)
    );
  }

   } catch (error) {

    console.error(
      "Groq Error:",
      error
    );

  }

} // ปิด askAI

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
          "มีอะไรให้ช่วยมั้ยครับ mob"
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
