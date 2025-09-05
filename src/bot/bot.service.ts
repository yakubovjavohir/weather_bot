import { Injectable } from '@nestjs/common';
import { Bot, Keyboard } from 'grammy';
import { regions } from './data/hammasi';
import { viloyatlar } from './data/viloyatlar';
import axios from 'axios';


@Injectable()
export class BotService {
  private bot : Bot
  private weather_key = 'd2b7230d65b54aafbe6112558250509'
  constructor(){
    this.bot = new Bot('8369405601:AAHRdxfSh61DO4yiwE3cC6R7ksf68GEem94')
    this.weatherBot()
  }

  weatherBot(){
    this.bot.start()

              this.bot.command("start", async (ctx) => {
                
                await ctx.replyWithPhoto("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv-a8Awd1oZJ_B3cODkmAg6mc8a6GgKlC4vg&s", {
                caption: 
                `🌤 Assalomu alaykum!  

Men — sizning shaxsiy Ob-havo yordamchingizman 🤖  

Bu yerda siz har kuni o‘z shahringizdagi ob-havo ma’lumotlarini osongina bilib olishingiz mumkin.  

☀️ Quyoshlimi, ☁️ bulutlimi, 🌧 yomg‘irlmi yoki ❄️ qorlimi — men sizga aytib beraman!  

🔎 Faqatgina viloyat va tumaningiz ni tanlang.`,
                reply_markup: new Keyboard()
                      .text("Toshkent")
                      .text("Samarqand")
                      .row()
                      .text("Farg‘ona")
                      .text("Andijon")
                      .row()
                      .text("Namangan")
                      .text("Buxoro")
                      .row()
                      .text("Xorazm")
                      .text("Qashqadaryo")
                      .row()
                      .text("Surxondaryo")
                      .text("Jizzax")
                      .row()
                      .text("Sirdaryo")
                      .text("Navoiy")
                      .resized()
                  });
                });




                // Viloyatlar keyboardi
                function getViloyatKeyboard() {
                  const kb = new Keyboard();
                  regions.forEach((r, i) => {
                    kb.text(r.viloyat);
                    if ((i + 1) % 2 === 0) kb.row();
                  });
                  return kb.resized();
                }

                // Tumanlar keyboardi
                function getTumanKeyboard(viloyat: string) {
                  const kb = new Keyboard();

                  const viloyatData = regions.find((r) => r.viloyat === viloyat);
                  if (!viloyatData) return kb; // agar topilmasa bo‘sh qaytadi

                  viloyatData.tumanlar.forEach((t, i) => {
                    kb.text(t.nom);
                    if ((i + 1) % 2 === 0) kb.row();
                  });

                  kb.row().text("⬅️ Qaytish"); // qaytish tugmasi
                  return kb.resized();
                }


                // emoji
                function getWeatherEmoji(condition: string): string {
                  const lower = condition.toLowerCase();

                  if (lower.includes("sun")) return "☀️ Quyoshli";
                  if (lower.includes("clear")) return "🌙 Ochiq osmon";
                  if (lower.includes("cloud")) return "☁️ Bulutli";
                  if (lower.includes("rain")) return "🌧 Yomg‘irli";
                  if (lower.includes("snow")) return "❄️ Qorli";
                  if (lower.includes("storm")) return "🌩 Momaqaldiroq";
                  if (lower.includes("fog")) return "🌫 Tumanli";

                  return "ℹ️ " + condition; // agar topilmasa asl textni qaytaradi
                }







                this.bot.on("message:text", async (ctx) => {
                  const tanlangan = ctx.message.text;

                  // Qaytish tugmasi
                  if (tanlangan === "⬅️ Qaytish") {
                    await ctx.reply("🌍 Viloyatingizni tanlang:", {
                      reply_markup: getViloyatKeyboard(),
                    });
                    return;
                  }

                  // Viloyat tanlanganini tekshirish
                  const viloyatData = regions.find((r) => r.viloyat === tanlangan);

                  if (viloyatData) {
                    await ctx.reply(`${tanlangan} viloyati tumanlari:`, {
                      reply_markup: getTumanKeyboard(tanlangan),
                    });
                    return;
                  }

                  // Tumanlarni tekshirish
                  let tumanData: any = null;
                  for (const r of regions) {
                    const t = r.tumanlar.find((t) => t.nom === tanlangan);
                    if (t) {
                      tumanData = t;
                      break;
                    }
                  }

                  if (tumanData) {
                    try {
                      const res = await axios.get("https://api.weatherapi.com/v1/current.json", {
                        params: { key: this.weather_key, q: `${tumanData.lat},${tumanData.lon}`, lang: "uz" }
                      });

                      const data = res.data;
                      const temp = data.current.temp_c;
                      const feels = data.current.feelslike_c;
                      const humidity = data.current.humidity;
                      const wind = data.current.wind_kph;
                      const cond = getWeatherEmoji(data.current.condition.text);
                      await ctx.reply(
                        `🌍 Joy: ${tumanData.nom}\n` +
                        `🌡 Harorat: ${temp}°C (his qilinadi: ${feels}°C)\n` +
                        `${cond}\n` +
                        `💧 Namlik: ${humidity}%\n` +
                        `🌬 Shamol: ${wind} km/soat`
                      );
                    } catch (err) {
                      console.error(err);
                      await ctx.reply("❌ Ob-havo ma’lumoti topilmadi yoki xatolik yuz berdi.");
                    }
                    return;
                  }

                  // Agar hech qaysi viloyat yoki tuman bo‘lmasa
                  await ctx.reply("❌ Bunday viloyat yoki tuman mavjud emas.");
                });

  }
}
