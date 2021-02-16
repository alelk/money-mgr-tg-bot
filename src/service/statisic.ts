import { AbstractGoogleSpreadsheetService } from "."
import { CategoryStatistic, MonthStatustic, TransactionTypeStatistic } from "../model/statistic"
import { Category, TransactionType } from "../model"
import { categoriesSvc, transactionTypesSvc } from "../services"

type RawCategoryStatistic = { category: Category, amount: number }

export class StatisticService extends AbstractGoogleSpreadsheetService {

    categoriesPromise: Promise<Category[]> = categoriesSvc.getCategories()
    transactionTypesPrimise: Promise<TransactionType[]> = transactionTypesSvc.getTransactionTypes()

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    private async categoryStatistic(category: Category, rawCategoryStatistic: RawCategoryStatistic[]): Promise<CategoryStatistic | undefined> {
        const childCategories = (await this.categoriesPromise).filter(c => c.parentCategoryName === category.name)
        const childStatistic =
            (await Promise.all(childCategories.map(c => this.categoryStatistic(c, rawCategoryStatistic))))
                .filter(v => v != null) as CategoryStatistic[]
        const childAmount = childStatistic.reduce((acc, c) => acc + c.amount, 0)
        const amount = rawCategoryStatistic.find(s => s.category == category)?.amount
        if (amount == null && childStatistic.length === 0) return undefined
        else return new CategoryStatistic(category, (amount == null ? 0 : amount) + childAmount, childStatistic)
    }

    async getStatistic(): Promise<MonthStatustic[]> {
        const d = await this.doc
        const sheet = d.sheetsByTitle["month report by category"]
        const rows = (await sheet.getRows()).filter(r => /20\d\d-\w\w\w/.test(r["date - Year-Month"]))
        const categories = await this.categoriesPromise
        const transactionTypes = await this.transactionTypesPrimise
        const statisticCategories = sheet.headerValues.map(h => categories.find(c => c.name === h)).filter(c => c != null) as Category[]
        const monthStatistic = rows.map(r => ({
            date: new Date(Date.parse(r["date - Year-Month"])),
            categories: statisticCategories.reduce((acc, c) => [...acc, { category: c, amount: Number.parseFloat(r[c.name]) }], [] as RawCategoryStatistic[])
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
                return new MonthStatustic(s.date, transactionTypeStatistic)
            })
        )
    }

}