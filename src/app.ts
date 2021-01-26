import { assert } from 'console'
import { Telegraf } from 'telegraf'

import { GoogleSpreadsheet } from 'google-spreadsheet'

const tgToken = process.env["TG_BOT_TOKEN"]

assert(tgToken != null, "No TG_BOT_TOKEN environment variable found")

const bot = new Telegraf(tgToken!)

const doc = new GoogleSpreadsheet("1qPm39FBUKRPVrk2jl3e8smeSb-yggdTo9IlCx7ff1Hc")

const moneyMgrEmail = process.env["MONEY_MGR_EMAIL"]
const moneyMgrKey = process.env["MONEY_MGR_KEY"]
assert(moneyMgrEmail != null, "No MONEY_MGR_EMAIL environment variable found")
assert(moneyMgrKey != null, "No MONEY_MGR_KEY environment variable found")

start()

async function start() {
    await doc.useServiceAccountAuth({
        client_email: moneyMgrEmail!,
        private_key: moneyMgrKey!.replace(/\\n/g, '\n')
    })

    await doc.loadInfo()
    const sheet = doc.sheetsByIndex[0]

    bot.start((ctx) => ctx.reply('Welcome'))

    bot.on('text', async (ctx) => {

        console.info(ctx.message.text)

        const r = /(?<date>\w+)\s+(?<type>\w+)\s+(?<category>\w+)\s+(?<amount>\d+)\s+(?<description>\w+)/
            .exec(ctx.message.text)

        if (r == null) ctx.reply("Неправильный текст")
        else
            await sheet.addRow({
                date: r?.groups?.date!,
                type: r?.groups?.type!,
                category: r?.groups?.category!,
                amount: r?.groups?.amount!,
                description: r?.groups?.description!
            })
    })

    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

