import { AbstractGoogleSpreadsheetService } from './index'
import { Category, CategoryRelationToParent, EditedTransaction, Transaction, TransactionDirection, TransactionType } from '../model'
import { CategoriesService } from './categories'
import { TransactionTypesService } from './transactionTypes'

export class TransactionsService extends AbstractGoogleSpreadsheetService {

    private lastTransactionRow?: number
    private categoriesSvc: CategoriesService
    private transactionTypesSvc: TransactionTypesService

    constructor(sheetId: string, authEmail: string, authKey: string, categoriesSvc: CategoriesService, transactionTypesSvc: TransactionTypesService) {
        super(sheetId, authEmail, authKey)
        this.categoriesSvc = categoriesSvc
        this.transactionTypesSvc = transactionTypesSvc
    }

    private async getSheet() {
        const d = await this.doc
        return d.sheetsByTitle["transactions"]
    }

    async addTransaction(t: Transaction) {
        const sheet = await this.getSheet()
        const row = await sheet.addRow({
            id: t.id,
            date: t.date.toDateString(),
            user: t.user,
            type: t.type.name,
            category: t.category.name,
            amount: t.amountOfMoney * await this.calculateCategoryFactor(t.category),
            comment: t.comment || ""
        })
        this.lastTransactionRow = row.rowNumber
    }

    async editTransaction(editedTransaction: EditedTransaction) {
        const sheet = await this.getSheet()
        const rows = (this.lastTransactionRow == null || this.lastTransactionRow - 1000 < 0)
            ? await sheet.getRows()
            : await sheet.getRows({ limit: 1000, offset: this.lastTransactionRow - 1000 })
        const row = rows.find(r => r.get("id").toString() === editedTransaction.id.toString())
        if (row == null) throw Error(`Не найдена финансовая транзакция с id ${editedTransaction.id}`)
        if (editedTransaction.date != null) row.set("date", editedTransaction.date.toDateString())
        if (editedTransaction.user != null) row.set("user", editedTransaction.user)
        if (editedTransaction.type != null) row.set("type", editedTransaction.type.name)
        if (editedTransaction.category != null) row.set("category", editedTransaction.category.name)
        const category = editedTransaction.category || await this.getCategory(row.get("category"))
        if (editedTransaction.amountOfMoney != null) row.set("amount", editedTransaction.amountOfMoney * await this.calculateCategoryFactor(category))
        if (editedTransaction.comment != null) row.set("comment", editedTransaction.comment)
        await row.save()
    }

    private transactionTypes?: Promise<TransactionType[]>

    private async getTransactionType(name: string): Promise<TransactionType> {
        if (this.transactionTypes == null) this.transactionTypes = this.transactionTypesSvc.getTransactionTypes()
        const r = (await this.transactionTypes).find(t => t.name == name)
        if (r != null) return r
        else throw Error(`Unknown transaction type name: ${name}`)
    }

    private categories?: Promise<Category[]>

    private async getCategory(name: string): Promise<Category> {
        if (this.categories == null) this.categories = this.categoriesSvc.getCategories()
        const r = (await this.categories).find(c => c.name == name)
        if (r != null) return r
        else throw Error(`Unknown category name: ${name}`)
    }

    private async transactionTypeFactor(name: string): Promise<1 | -1> {
        if ((await this.getTransactionType(name)).direction == TransactionDirection.OUTCOME) return -1
        else return 1
    }

    private async calculateCategoryFactor(category: Category): Promise<1 | -1> {
        const currentFactor = category.relationToParent == CategoryRelationToParent.NEGATIVE ? -1 : 1
        if (category.parentCategoryName != null) {
            const parentFactor = await this.calculateCategoryFactor(await this.getCategory(category.parentCategoryName))
            return currentFactor * parentFactor as 1 | -1
        }
        else {
            const transactionTypeFactor = await this.transactionTypeFactor(category.transactionTypeName)
            return currentFactor * transactionTypeFactor as 1 | -1
        }
    }
}