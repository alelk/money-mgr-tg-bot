import { assert } from 'console'
import { Telegraf } from 'telegraf'
import { transactionParser } from './parser'
import { transactionTypesSvc, categoriesSvc, transactionsSvc } from './services'
import { Category, Transaction, TransactionType } from './model'


const tgToken = process.env["TG_BOT_TOKEN"]

assert(tgToken != null, "No TG_BOT_TOKEN environment variable found")

const bot = new Telegraf(tgToken!)

const transactionTypes = transactionTypesSvc.getTransactionTypes()
const categories = categoriesSvc.getCategories()
const parser = categories.then(transactionParser)
async function transactionTypeByCategory(category: Category): Promise<TransactionType> {
    const types = await transactionTypes
    const t = types.find(t => t.name === category.transactionTypeName)
    if (t == null) throw new Error(`Не найден тип транзакции ${category.transactionTypeName} (категория ${category.name})`)
    return t
}

bot.start((ctx) => ctx.reply('Добро пожаловать в финансовый бот чат'))

bot.on('text', async (ctx) => {
    try {
        const p = await parser
        const result = p.transaction.parse(ctx.message.text)
        if (result.status == true) {
            const transactionType = await transactionTypeByCategory(result.value.category)
            const t = new Transaction(
                result.value.date || new Date(),
                ctx.message.from.username!,
                transactionType,
                result.value.category,
                result.value.amountOfMoney,
                result.value.comment)
            await transactionsSvc.addTransaction(t)
            ctx.replyWithMarkdown(
                `запись добавлена: ${t.type.name} \`${t.date.toDateString()}\`, категория \`${t.category.name}\`, ` +
                `сумма \`${t.amountOfMoney} руб.\` ${t.comment != null ? `\`${t.comment}\``: ''}`)
        } else {
            ctx.replyWithMarkdown(
                `не понял (строка ${result.index.line} отступ ${result.index.offset}): \n` +
                `ожидается одно из следующих выражений: ${result.expected.map(e => `\`${e}\``).join(", ")}`)
        }
    } catch (e) {
        ctx.reply("непредвиденная ошибка: " + e)
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

