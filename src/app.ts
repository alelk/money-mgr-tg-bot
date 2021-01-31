import { assert } from 'console'
import { Markup, Telegraf } from 'telegraf'
import { transactionParser } from './parser'
import { transactionTypesSvc, categoriesSvc, transactionsSvc } from './services'
import { Category, Transaction, TransactionType } from './model'
import { sleep } from './util'
import { Message, Update } from 'telegraf/typings/telegram-types'


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

async function parseTransaction(m: Message.TextMessage & Update.NonChannel): Promise<Transaction> {
    const p = await parser
    const result = p.transaction.parse(m.text)
    if (result.status == true) {
        const transactionType = await transactionTypeByCategory(result.value.category)
        return new Transaction(
            m.message_id,
            result.value.date || new Date(),
            `${m.from.first_name}${m.from.last_name ? ' ' + m.from.last_name : ''}`,
            transactionType,
            result.value.category,
            result.value.amountOfMoney,
            result.value.comment)
    } else throw new Error(
        `не понял (строка ${result.index.line} отступ ${result.index.offset}): \n` +
        `ожидается одно из следующих выражений: ${result.expected.map(e => `\`${e}\``).join(", ")}`)
}

const invalidMessageIds: Set<number> = new Set()

bot.start((ctx) => ctx.reply('Добро пожаловать в финансовый бот чат'))

bot.on('text', async (ctx) => {
    try {
        const t = await parseTransaction(ctx.message)
        await transactionsSvc.addTransaction(t)
        await ctx.replyWithMarkdown(
            `запись добавлена: ${t.type.name} \`${t.date.toDateString()}\` категория \`${t.category.name}\` ` +
            `сумма \`${t.amountOfMoney} руб.\` ${t.comment != null ? ` комментарий \`${t.comment}\`` : ''}`, { reply_to_message_id: ctx.message.message_id })
    } catch (e) {
        invalidMessageIds.add(ctx.message.message_id)
        const m = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: ctx.message.message_id })
        setTimeout(() => ctx.deleteMessage(m.message_id), 60000)
    }
})

bot.on('edited_message', async (ctx) => {
    const msg = ctx.update.edited_message as Message.TextMessage & Update.NonChannel
    if (msg.text != null) {
        try {
            const t = await parseTransaction(msg)
            const isNewTransaction = invalidMessageIds.has(msg.message_id)
            if (isNewTransaction) {
                await transactionsSvc.addTransaction(t)
                invalidMessageIds.delete(msg.message_id)
            }
            else await transactionsSvc.editTransaction(t)
            await ctx.replyWithMarkdown(
                `запись ${isNewTransaction ? 'добавлена' : 'изменена'}: ${t.type.name} \`${t.date.toDateString()}\` категория \`${t.category.name}\` ` +
                `сумма \`${t.amountOfMoney} руб.\` ${t.comment != null ? ` комментарий \`${t.comment}\`` : ''}`, { reply_to_message_id: msg.message_id })
        } catch (e) {
            const m = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: msg.message_id })
            setTimeout(() => ctx.deleteMessage(m.message_id), 60000)
        }
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

