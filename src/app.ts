import {Telegraf} from 'telegraf'

const bot = new Telegraf("1577224234:AAG6mx9R6FKjAQWl9ZH2rGH5KhQYB4MCtTw")
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hello !!!!!!!'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))