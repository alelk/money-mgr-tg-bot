import { AbstractGoogleSpreadsheetService } from "."
import { CategoryStatistic, MonthStatustic, TransactionTypeStatistic } from "../model/statistic"
import { Category, CategoryRelationToParent, TransactionDirection, TransactionType } from "../model"
import { categoriesSvc, transactionTypesSvc } from "../services"

type RawCategoryStatistic = { category: Category, amount: number }

export class StatisticService extends AbstractGoogleSpreadsheetService {

    categoriesPromise: Promise<Category[]> = categoriesSvc.getCategories()
    transactionTypesPromise: Promise<TransactionType[]> = transactionTypesSvc.getTransactionTypes()

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    private async categoryStatistic(category: Category, rawCategoryStatistic: RawCategoryStatistic[]): Promise<CategoryStatistic | undefined> {
        const childCategories = (await this.categoriesPromise).filter(c => c.parentCategoryName === category.name)
        const childStatistic =
            (await Promise.all(childCategories.map(c => this.categoryStatistic(c, rawCategoryStatistic))))
                .filter(v => v != null) as CategoryStatistic[]
        const childAmount = childStatistic.reduce((acc, c) => c.category.relationToParent == CategoryRelationToParent.POSITIVE ? acc + c.amount : acc - c.amount, 0)
        const amount = rawCategoryStatistic.find(s => s.category.name == category.name)?.amount
        if ((amount == null || amount == 0) && childStatistic.length === 0) return undefined
        else return new CategoryStatistic(category, (amount == null ? 0 : category.relationToParent === CategoryRelationToParent.POSITIVE ? amount : -amount) + childAmount, childStatistic)
    }

    async getStatistic(): Promise<MonthStatustic[]> {
        const d = await this.doc
        d.resetLocalCache()
        await d.loadInfo()
        const sheet = d.sheetsByTitle["month report by category"]
        const rows = (await sheet.getRows()).filter(r => /20\d\d-\w\w\w/.test(r.get("date - Year-Month")))
        const categories = await this.categoriesPromise
        const transactionTypes = await this.transactionTypesPromise
        const statisticCategories =
            sheet.headerValues.filter(h => h != 'date - Year-Month').map(h => {
                const c = categories.find(c => c.name === h)
                if (c == null) throw new Error(`Category not found: ${h}`)
                return c
            }) as Category[]
        const monthStatistic = rows.map(r => ({
            date: new Date(Date.parse(r.get("date - Year-Month"))),
            categories: statisticCategories.reduce((acc, c) =>
                [...acc, { category: c, amount: Number.parseFloat(r.get(c.name) == null || r.get(c.name).trim() === '' ? 0 : r.get(c.name)) }]
                , [] as RawCategoryStatistic[])
        }))
        const rootCategories = categories.filter(c => c.parentCategoryName == null)
        return await Promise.all(
            monthStatistic.map(async s => {
                const transactionTypeStatistic = (await Promise.all(
                    transactionTypes.map(async t => {
                        const transactionTypeCategories = rootCategories.filter(c => c.transactionTypeName === t.name)
                        if (transactionTypeCategories.length === 0) return undefined
                        const transactionTypeCategoriesStatistic = (await Promise.all(
                            transactionTypeCategories.map(c => this.categoryStatistic(c, s.categories))
                        )).filter(v => v != null) as CategoryStatistic[]
                        if (transactionTypeCategoriesStatistic.length === 0) return undefined
                        const amount = transactionTypeCategoriesStatistic.reduce((acc, v) => acc + v.amount, 0)
                        return new TransactionTypeStatistic(t, amount, transactionTypeCategoriesStatistic)
                    }))
                ).filter(v => v != null) as TransactionTypeStatistic[]
                const total = transactionTypeStatistic.reduce(({ formula, amount }, s) =>
                    s.transactionType.direction === TransactionDirection.INCOME //&& amount !== 0
                        ? {
                            formula: (formula === '' ? `${s.amount} [${s.transactionType.name}]` : `${formula} + ${s.amount} [${s.transactionType.name}]`),
                            amount: amount + s.amount
                        }
                        : s.transactionType.direction === TransactionDirection.OUTCOME //&& amount !== 0
                            ? {
                                formula: (formula === '' ? `${s.amount} [${s.transactionType.name}]` : `${formula} - ${s.amount} [${s.transactionType.name}]`),
                                amount: amount - s.amount
                            }
                            : { formula, amount },
                    { formula: '', amount: 0 })
                return new MonthStatustic(s.date, transactionTypeStatistic, `${total.formula} = ${total.amount} руб.`)
            })
        )
    }

}