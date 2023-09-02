import { assert } from 'console'
import { Telegraf } from 'telegraf'
import { transactionParser } from './parser/transactions'
import { transactionTypesSvc, categoriesSvc, transactionsSvc, statisticSvc } from './services'
import { Category, Transaction, TransactionType } from './model'
import _ from 'lodash'
import { CategoryStatistic } from './model/statistic'
import { statisticRequestParser } from './parser/statisticRequest'
import { Message, Update } from 'telegraf/typings/core/types/typegram'


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

bot.hears(/статистика(.*)/i, async (ctx) => {
    try {
        const request = statisticRequestParser.statisticRequest.tryParse(ctx.message.text)
        const s = (await statisticSvc.getStatistic()).find(s => s.date.getFullYear() === request.date.getFullYear() && s.date.getMonth() === request.date.getMonth())
        if (s == null) await ctx.reply("Статистика не найдена")
        else {
            const msgText = `Статистика за ${s.date.getFullYear()}-${s.date.getMonth() + 1}:\n\n` +
                s.transactionTypeStatistic.map(({ transactionType, categories, amount }) => {
                    function printCategoryStatistic(categoryStatistic: CategoryStatistic, level = 0): string[] {
                        const children = (categoryStatistic.children || []).reduce((acc, с) => [...acc, ...printCategoryStatistic(с, level + 1)], [] as string[])
                        return [
                            `\`${(level === 0 ? '\*' : '\*'.padStart(level + 1)).padEnd(3)
                            }${categoryStatistic.amount.toString().padStart(6)
                            } руб.\` #${categoryStatistic.category.name.replace(/[^\w\dа-я]+/ig, '\\_')}`,
                            ...children
                        ]
                    }
                    return `*#${transactionType.name.trim().replace(/[^\w\dа-я]+/ig, '_')}*   \`${amount} руб.\`\n\n` +
                        categories.map(categoryStatistic => printCategoryStatistic(categoryStatistic).join('\n')).join('\n\n')
                }).join('\n\n') + `\n\n--\nИтог месяца: \`${s.result}\``
            await ctx.replyWithMarkdown(msgText)
        }
    } catch (e) {
        invalidMessageIds.add(ctx.message.message_id)
        const m1 = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: ctx.message.message_id })
        const m2 = await ctx.replyWithMarkdown(`${helpMsg}\nСообщение будет удалено через минуту`)
        delay(60000, () => ctx.deleteMessage(m1.message_id))
        delay(60000, () => ctx.deleteMessage(m2.message_id))
    }
})

bot.command('categories', async (ctx) => {
    try {
        const cs = await categories
        const msgText = (await transactionTypes).map(t =>
            `*${t.name}*:\n \`\`\`\n  ${_.sortBy(
                cs.filter(c => c.transactionTypeName === t.name && !cs.find(c1 => c1.parentCategoryName === c.name)),
                "name")
                .map(c => c.name)//`${c.name} (${c.synonyms.filter(s => typeof s.value == 'string').map(s => s.value).join(", ")})`)
                .join("\n  ")
            }\n\`\`\``)
            .join("\n\n")
        const m = await ctx.replyWithMarkdown(msgText)
        delay(120000, () => ctx.deleteMessage(ctx.message.message_id))
        delay(120000, () => ctx.deleteMessage(m.message_id))
    } catch (e) {
        invalidMessageIds.add(ctx.message.message_id)
        const m1 = await ctx.replyWithMarkdown(`${(e as Error).message || e}\n\nсообщение об ошибке будет удалено через 1 минуту`, { reply_to_message_id: ctx.message.message_id })
        const m2 = await ctx.replyWithMarkdown(`${helpMsg}\nСообщение будет удалено через минуту`)
        delay(60000, () => ctx.deleteMessage(m1.message_id))
        delay(60000, () => ctx.deleteMessage(m2.message_id))
    }
})

bot.on('text', async (ctx) => {
    try {
        const t = await parseTransaction(ctx.message)
        await transactionsSvc.addTransaction(t)
        await ctx.replyWithMarkdown(
            `запись добавлена: #${t.type.name.replace(/[^\w\dа-я]+/ig, '\\_')} \`${t.date.toLocaleDateString('ru')}\` ` +
            `категория #${t.category.name.replace(/[^\w\dа-я]+/ig, '\\_')} ` +
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
                `запись ${isNewTransaction ? 'добавлена' : 'изменена'}: #${t.type.name.replace(/[^\w\dа-я]+/ig, '\\_')} ` +
                `\`${t.date.toLocaleDateString('ru')}\` категория #${t.category.name.replace(/[^\w\dа-я]+/ig, '\\_')} ` +
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

