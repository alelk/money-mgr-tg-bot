import { assert } from 'console'
import { Telegraf } from 'telegraf'
import { transactionParser } from './parser'
import { transactionTypesSvc, categoriesSvc, transactionsSvc, statisticSvc } from './services'
import { Category, Transaction, TransactionType } from './model'
import { Message, Update } from 'telegraf/typings/telegram-types'
import _ from 'lodash'


const tgToken = process.env["TG_BOT_TOKEN"]

assert(tgToken != null, "No TG_BOT_TOKEN environment variable found")

const bot = new Telegraf(tgToken!)

const transactionTypes = transactionTypesSvc.getTransactionTypes()
const categories = categoriesSvc.getCategories()
// const statistic = statisticSvc.getStatistic()

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
        const { category, date, amountOfMoney, comment } = result.value
        const transactionType = await transactionTypeByCategory(category)
        const categoryComment = category.userText != null ? `[${category.userText}]` : null
        return new Transaction(
            m.message_id,
            date || new Date(),
            `${m.from.first_name}${m.from.last_name ? ' ' + m.from.last_name : ''}`,
            transactionType,
            category,
            amountOfMoney,
            categoryComment != null || comment != null ? `${categoryComment ? categoryComment : ''}${comment ? ' ' + comment : ''}` : undefined)
    } else throw new Error(
        `не понял (строка ${result.index.line} отступ ${result.index.offset}): \n` +
        `ожидается одно из следующих выражений: ${result.expected.map(e => `\`${e}\``).join(", ")}`)
}

function delay(millis: number, f: () => void) {
    setTimeout(() => {
        try {
            f()
        } catch (e) {
            console.error(e)
        }
    }, millis)
}

const invalidMessageIds: Set<number> = new Set()

bot.start((ctx) => ctx.reply('Добро пожаловать в финансовый бот чат'))

const helpMsg =
    `Примеры сообщений:
  \`продукты 100\`
  \`продукты 100 рублей мясо, хлеб\`
  \`вчера бензин 238\`
  \`5 дней назад дал в долг 1000 р. Роману\`

_структура сообщения:_ \`когда что сколько комментарий\`
`

bot.command('help', async (ctx) => {
    const m = await ctx.replyWithMarkdown(`${helpMsg}\nСообщение будет удалено через минуту`)
    delay(60000, () => ctx.deleteMessage(m.message_id))
})

bot.command('categories', async (ctx) => {
    const cs = await categories
    const msgText = (await transactionTypes).map(t =>
        `*${t.name}*:\n${cs.filter(c => c.transactionTypeName === t.name && !cs.find(c1 => c1.parentCategoryName === c.name))
            .map(c => `\`${c.name}\``).join(", ")}`)
        .join("\n\n")
    const m = await ctx.replyWithMarkdown(msgText)
    delay(120000, () => ctx.deleteMessage(m.message_id))
})

bot.on('text', async (ctx) => {
    try {
        const t = await parseTransaction(ctx.message)
        await transactionsSvc.addTransaction(t)
        await ctx.replyWithMarkdown(
            `запись добавлена: #${t.type.name.replace(/\s+/g, '\\_')} \`${t.date.toLocaleDateString('ru')}\` ` + 
            `категория #${t.category.name.replace(/\s+/g, '\\_')} ` +
            `сумма \`${t.amountOfMoney} руб.\` ${t.comment != null ? ` комментарий \`${t.comment}\`` : ''}`, { reply_to_message_id: ctx.message.message_id })
    } catch (e) {
        invalidMessageIds.add(ctx.message.message_id)
        const m1 = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: ctx.message.message_id })
        const m2 = await ctx.replyWithMarkdown(`${helpMsg}\nСообщение будет удалено через минуту`)
        delay(60000, () => ctx.deleteMessage(m1.message_id))
        delay(60000, () => ctx.deleteMessage(m2.message_id))
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
                `запись ${isNewTransaction ? 'добавлена' : 'изменена'}: #${t.type.name.replace(/\s+/g, '\\_')} ` + 
                `\`${t.date.toLocaleDateString('ru')}\` категория #${t.category.name.replace(/\s+/g, '\\_')} ` +
                `сумма \`${t.amountOfMoney} руб.\` ${t.comment != null ? ` комментарий \`${t.comment}\`` : ''}`, { reply_to_message_id: msg.message_id })
        } catch (e) {
            const m1 = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: msg.message_id })
            const m2 = await ctx.replyWithMarkdown(`${helpMsg}\nСообщение будет удалено через минуту`)
            delay(60000, () => ctx.deleteMessage(m1.message_id))
            delay(60000, () => ctx.deleteMessage(m2.message_id))
        }
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

